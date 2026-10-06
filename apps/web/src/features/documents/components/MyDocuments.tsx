"use client";

import { Badge, ButtonLink, EmptyState } from "@pratikar/ui";
import { ChevronRight, FilePenLine, FileText } from "lucide-react";
import Link from "next/link";

import { Icon } from "@/shared/components/Icon";

import type { MyDocument } from "../api/documentsApi";
import { documentStage } from "../lib/documentStage";

/**
 * The customer's documents, one compact row each, with where it stands —
 * drafting, awaiting review, ready. Each row opens the document's own page,
 * which is where the preview, the review and the download live.
 *
 * Presentational: the account is loaded once by useDashboardData and handed
 * down.
 */
export function MyDocuments({ documents }: { documents: MyDocument[] }) {
  if (documents.length === 0) {
    return (
      <EmptyState
        title="No documents yet"
        description="Fill in one of our templates, or describe any document and have the AI draft it — an advocate reviews it before you download."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <ButtonLink href="/documents/custom">Draft with AI</ButtonLink>
            <ButtonLink href="/documents" variant="secondary">
              Browse templates
            </ButtonLink>
          </div>
        }
      />
    );
  }

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
      {documents.map((doc) => {
        const stage = documentStage(doc);
        return (
          <li key={doc.id}>
            <Link
              href={`/dashboard/documents/${doc.id}`}
              className="group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-surface-sunken sm:px-5"
            >
              <span
                aria-hidden
                className="grid h-11 w-11 shrink-0 place-items-center rounded-control bg-primary-subtle text-primary"
              >
                <Icon
                  icon={doc.kind === "CUSTOM" ? FilePenLine : FileText}
                  size="md"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.9375rem] font-semibold text-ink group-hover:text-primary">
                  {doc.title}
                </span>
                <span className="mt-0.5 block text-xs text-ink-muted">
                  {doc.kind === "CUSTOM" ? "AI draft" : "Template"} ·{" "}
                  {new Date(doc.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </span>
              <Badge tone={stage.tone}>{stage.label}</Badge>
              <Icon
                icon={ChevronRight}
                className="hidden shrink-0 text-ink-subtle transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none sm:block"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
