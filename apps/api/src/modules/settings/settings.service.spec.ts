import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { Role } from "@pratikar/types";

import type { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

import { SettingsService } from "./settings.service";

function build(stored: Record<string, unknown> = {}) {
  const siteSetting = {
    findUnique: jest.fn(({ where }: { where: { key: string } }) =>
      Promise.resolve(
        stored[where.key] ? { key: where.key, value: stored[where.key] } : null,
      ),
    ),
    // Keeps what was saved, so a read after a save sees it.
    upsert: jest.fn(
      ({
        where,
        update,
      }: {
        where: { key: string };
        update: { value: unknown };
      }) => {
        stored[where.key] = update.value;
        return Promise.resolve();
      },
    ),
  };
  const prisma = { siteSetting, auditLog: { create: jest.fn() } };
  const db = {
    ...prisma,
    $transaction: jest.fn((cb: (tx: typeof prisma) => unknown) => cb(prisma)),
  };
  const service = new SettingsService(
    db as unknown as PrismaService,
    new AuditService(db as unknown as PrismaService),
  );
  return { service, siteSetting, prisma };
}

const CERTIFICATE = {
  title: "Certificate of Completion",
  issuerName: "Pratikar Digital Hub",
  signatoryName: "Adv. R. Sen",
  signatoryTitle: "Director",
  footerNote: "",
};

describe("SettingsService", () => {
  const env = process.env.CUSTOM_DRAFT_REVIEW_PRICE_PAISE;
  afterEach(() => {
    process.env.CUSTOM_DRAFT_REVIEW_PRICE_PAISE = env;
  });

  it("uses the defaults before anyone has saved a setting", async () => {
    delete process.env.CUSTOM_DRAFT_REVIEW_PRICE_PAISE;
    const { service } = build();

    await expect(service.customDraftReviewPrice()).resolves.toBe(49_900);
    await expect(service.get("certificate")).resolves.toMatchObject({
      title: "Certificate of Completion",
    });
  });

  it("falls back to the old environment variable for the price", async () => {
    process.env.CUSTOM_DRAFT_REVIEW_PRICE_PAISE = "79900";
    const { service } = build();

    await expect(service.customDraftReviewPrice()).resolves.toBe(79_900);
  });

  it("prefers a saved value over both", async () => {
    process.env.CUSTOM_DRAFT_REVIEW_PRICE_PAISE = "79900";
    const { service } = build({
      pricing: { customDraftReviewPricePaise: 59_900 },
    });

    await expect(service.customDraftReviewPrice()).resolves.toBe(59_900);
  });

  it("lets a Content Manager edit the certificate but not the price", async () => {
    const { service } = build();
    const cm = { id: "u1", role: Role.CONTENT_MANAGER };

    await expect(
      service.update("certificate", CERTIFICATE, cm),
    ).resolves.toMatchObject({
      signatoryName: "Adv. R. Sen",
    });
    await expect(
      service.update("pricing", { customDraftReviewPricePaise: 100 }, cm),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("validates the value, and refuses fields the setting doesn't have", async () => {
    const { service, siteSetting } = build();
    const sa = { id: "u1", role: Role.SUPER_ADMIN };

    await expect(
      service.update("pricing", { customDraftReviewPricePaise: 0 }, sa),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.update("certificate", { ...CERTIFICATE, extra: "x" }, sa),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(siteSetting.upsert).not.toHaveBeenCalled();
  });

  it("audits a change", async () => {
    const { service, prisma } = build();

    await service.update("certificate", CERTIFICATE, {
      id: "u1",
      role: Role.ADMIN,
    });

    const { data } = (
      prisma.auditLog.create.mock.calls[0] as [
        { data: { action: string; targetId: string } },
      ]
    )[0];
    expect(data).toMatchObject({
      action: "SETTINGS_UPDATED",
      targetId: "certificate",
    });
  });

  it("refuses an unknown setting", async () => {
    const { service } = build();
    await expect(
      service.update("nope", {}, { id: "u1", role: Role.SUPER_ADMIN }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
