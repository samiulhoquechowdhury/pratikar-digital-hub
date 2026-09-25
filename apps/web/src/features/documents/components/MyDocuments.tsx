"use client";

import type { GeneratedDocument } from "@pratikar/types";
import { Badge, ButtonLink, Card, EmptyState } from "@pratikar/ui";

import type { MyDocument } from "../api/documentsApi";

import { GeneratedDocumentActions } from "./GeneratedDocumentActions";

/** What each status means to the person looking at it, not to the database. */
const STATUS: Record<
  GeneratedDocument["status"],
  { label: string; tone: "warning" | "success" | "neutral" }
> = {
  GENERATED: { label: "Awaiting payment", tone: "warning" },
  PAID: { label: "Ready to download", tone: "success" },
  DOWNLOADED: { label: "Downloaded", tone: "neutral" },
};

/**
 * The customer's generated documents, each with whatever action it's waiting
 * on — pay, download, or nothing. Documents are commonly generated in one
 * sitting and paid for in another, so the dashboard has to be able to finish
 * the transaction, not just report on it.
 *
 * Presentational: the account is loaded once by useDashboardData and handed
 * down. This used to fetch for itself, along with its own auth gate, loading
 * state and error — which is how a signed-out visitor ended up looking at
 * three separate "Sign in" cards down one page.
 */
export function MyDocuments({ documents }: { documents: MyDocument[] }) {
  if (documents.length === 0) {
    return (
      <EmptyState
        title="No documents yet"
        description="Pick a template, answer the questions, and your document appears here."
        action={<ButtonLink href="/documents">Browse templates</ButtonLink>}
      />
    );
  }

  return (
    <ul className="space-y-4">
      {documents.map((doc) => (
        <li key={doc.id}>
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base">{doc.template.title}</h3>
                <p className="mt-1 text-sm text-ink-subtle">
                  Generated{" "}
                  {new Date(doc.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <Badge tone={STATUS[doc.status].tone}>
                {STATUS[doc.status].label}
              </Badge>
            </div>

            <div className="mt-5 border-t border-line pt-5">
              <GeneratedDocumentActions
                documentId={doc.id}
                template={doc.template}
                initialStatus={doc.status}
              />
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
