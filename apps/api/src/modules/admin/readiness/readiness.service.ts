import { execFile } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { promisify } from "node:util";

import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import type { Queue } from "bullmq";

import { PrismaService } from "../../../prisma/prisma.service";
import { StorageService } from "../../storage/storage.service";

import {
  configChecks,
  type CheckStatus,
  type ReadinessCheck,
} from "./config-checks";

const execFileAsync = promisify(execFile);

export const HEALTH_QUEUE = "health";

/** A dependency that hasn't answered by now counts as down. */
const PROBE_TIMEOUT_MS = 10_000;

const withTimeout = <T>(work: Promise<T>, ms = PROBE_TIMEOUT_MS) =>
  Promise.race([
    work,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`no answer in ${ms / 1000}s`)), ms),
    ),
  ]);

const message = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export interface ReadinessReport {
  ready: boolean;
  summary: Record<CheckStatus, number>;
  checks: ReadinessCheck[];
}

/**
 * The launch checklist: every setting (config-checks.ts) plus every
 * dependency, actually tried — the database answers, the bucket answers,
 * LibreOffice runs. "Ready" means nothing failed; warnings are features
 * that are switched off on purpose.
 */
@Injectable()
export class ReadinessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    @InjectQueue(HEALTH_QUEUE) private readonly queue: Queue,
  ) {}

  /** Database and Redis — what the API can't serve a request without. */
  async health(): Promise<{ database: boolean; redis: boolean }> {
    const [database, redis] = await Promise.all([
      withTimeout(this.prisma.$queryRaw`SELECT 1`, 3000).then(
        () => true,
        () => false,
      ),
      withTimeout(this.pingRedis(), 3000).then(
        () => true,
        () => false,
      ),
    ]);
    return { database, redis };
  }

  async report(): Promise<ReadinessReport> {
    const probes = await Promise.all([
      this.database(),
      this.migrations(),
      this.redis(),
      this.files(),
      this.program(
        "soffice",
        ["--headless", "--version"],
        "LibreOffice",
        "Turns Word documents into PDFs — every document generation needs it.",
      ),
      this.program(
        "gs",
        ["--version"],
        "Ghostscript",
        "Renders the watermarked previews.",
      ),
      this.templates(),
      this.searchIndex(),
    ]);
    const checks = [...probes.flat(), ...configChecks(process.env)];
    const summary = { ok: 0, warn: 0, fail: 0 };
    for (const check of checks) summary[check.status] += 1;
    return { ready: summary.fail === 0, summary, checks };
  }

  /** A real round trip to Redis: counting the (always empty) health queue. */
  private async pingRedis(): Promise<void> {
    await this.queue.count();
  }

  private async database(): Promise<ReadinessCheck[]> {
    const base = { area: "Services", label: "Database" };
    try {
      const [extension] = await withTimeout(
        this.prisma.$queryRaw<{ installed: boolean }[]>`
          SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') AS installed`,
      );
      return [
        { id: "DATABASE", ...base, status: "ok", detail: "Connected." },
        extension?.installed
          ? {
              id: "PGVECTOR",
              area: "Services",
              label: "pgvector",
              status: "ok",
              detail: "Installed.",
            }
          : {
              id: "PGVECTOR",
              area: "Services",
              label: "pgvector",
              status: "fail",
              detail:
                "The vector extension isn't installed — the assistant's search can't run.",
              fix: "Use a Postgres with pgvector (Railway's pgvector template) and run the migrations.",
            },
      ];
    } catch (error) {
      return [
        {
          id: "DATABASE",
          ...base,
          status: "fail",
          detail: `Can't reach it: ${message(error)}`,
          fix: "Check DATABASE_URL.",
        },
      ];
    }
  }

  /**
   * Every migration in the image applied. Compares the migrations folder
   * with Prisma's record of what ran; the Docker image runs them at start,
   * so a gap means that step failed.
   */
  private async migrations(): Promise<ReadinessCheck[]> {
    const base = {
      id: "MIGRATIONS",
      area: "Services",
      label: "Database migrations",
    };
    const dir = path.join(process.cwd(), "prisma", "migrations");
    if (!fs.existsSync(dir)) {
      return [
        {
          ...base,
          status: "warn",
          detail: "No migrations folder next to the API — can't compare.",
        },
      ];
    }
    try {
      const shipped = fs
        .readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);
      const applied = await this.prisma.$queryRaw<{ migration_name: string }[]>`
        SELECT migration_name FROM "_prisma_migrations"
        WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`;
      const done = new Set(applied.map((row) => row.migration_name));
      const pending = shipped.filter((name) => !done.has(name));
      return [
        pending.length === 0
          ? { ...base, status: "ok", detail: `All ${shipped.length} applied.` }
          : {
              ...base,
              status: "fail",
              detail: `${pending.length} not applied: ${pending.join(", ")}.`,
              fix: "Run prisma migrate deploy (the Docker image does at start — check its logs).",
            },
      ];
    } catch (error) {
      return [{ ...base, status: "fail", detail: message(error) }];
    }
  }

  private async redis(): Promise<ReadinessCheck[]> {
    const base = {
      id: "REDIS",
      area: "Services",
      label: "Redis (background jobs)",
    };
    try {
      await withTimeout(this.pingRedis());
      return [{ ...base, status: "ok", detail: "Connected." }];
    } catch (error) {
      return [
        {
          ...base,
          status: "fail",
          detail: `Can't reach it: ${message(error)} — documents, emails and reminders won't run.`,
          fix: "Check REDIS_URL.",
        },
      ];
    }
  }

  private async files(): Promise<ReadinessCheck[]> {
    const base = { id: "STORAGE", area: "Services", label: "File storage" };
    try {
      const where = await withTimeout(this.storage.probe());
      return [
        where === "r2"
          ? { ...base, status: "ok", detail: "The R2 bucket answers." }
          : {
              ...base,
              status: "fail",
              detail:
                "Files go to this server's own disk and are lost on the next deploy.",
              fix: "Configure R2 (see the R2 check below).",
            },
      ];
    } catch (error) {
      return [
        {
          ...base,
          status: "fail",
          detail: `R2 is configured but doesn't answer: ${message(error)}`,
          fix: "Check the R2 keys, the bucket name, and that the key may read it.",
        },
      ];
    }
  }

  private async program(
    command: string,
    args: string[],
    label: string,
    needs: string,
  ): Promise<ReadinessCheck[]> {
    const base = { id: command.toUpperCase(), area: "Services", label };
    try {
      const { stdout } = await execFileAsync(command, args, {
        timeout: 20_000,
      });
      return [
        {
          ...base,
          status: "ok",
          detail: stdout.trim().split("\n")[0] ?? "Runs.",
        },
      ];
    } catch {
      return [
        {
          ...base,
          status: "fail",
          detail: `${command} isn't installed or doesn't run. ${needs}`,
          fix: "Deploy the API from apps/api/Dockerfile, which installs it.",
        },
      ];
    }
  }

  /** A published template with no Word file can be bought but never generated. */
  private async templates(): Promise<ReadinessCheck[]> {
    const base = {
      id: "TEMPLATES",
      area: "Catalogue",
      label: "Document templates",
    };
    const [published, withoutFile] = await Promise.all([
      this.prisma.template.count({ where: { status: "PUBLISHED" } }),
      this.prisma.template.findMany({
        where: { status: "PUBLISHED", templateFileKey: null },
        select: { title: true },
      }),
    ]);
    if (withoutFile.length > 0) {
      return [
        {
          ...base,
          status: "fail",
          detail: `Published without a Word file, so they can't be generated: ${withoutFile.map((t) => t.title).join(", ")}.`,
          fix: "Upload each one's tagged .docx in Admin → Templates, or unpublish it.",
        },
      ];
    }
    return [
      published > 0
        ? {
            ...base,
            status: "ok",
            detail: `${published} published, all with their file.`,
          }
        : { ...base, status: "warn", detail: "None published yet." },
    ];
  }

  /** The assistant's catalogue search has something to search. */
  private async searchIndex(): Promise<ReadinessCheck[]> {
    const base = {
      id: "SEARCH_INDEX",
      area: "Catalogue",
      label: "Assistant search index",
    };
    const indexed = await this.prisma.knowledgeBaseDocument.count();
    return [
      indexed > 0
        ? { ...base, status: "ok", detail: `${indexed} items indexed.` }
        : {
            ...base,
            status: "warn",
            detail: "Empty — the assistant has nothing to recommend from.",
            fix: "With VOYAGE_API_KEY set, run POST /ai/knowledge-base/reindex once.",
          },
    ];
  }
}
