"use client";

import type { GeneratedDocument, Template } from "@pratikar/types";
import {
  Alert,
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  Loading,
} from "@pratikar/ui";
import { useEffect, useState } from "react";

import { useAuth } from "@/shared/providers/AuthProvider";

import { documentsApi } from "../api/documentsApi";

import { GeneratedDocumentActions } from "./GeneratedDocumentActions";

/** listMine joins the template so a row can be labelled and priced. */
type MyDocument = GeneratedDocument & {
  template: Pick<Template, "title" | "priceInPaise" | "reviewPriceInPaise">;
};

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
 */
export function MyDocuments() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<MyDocument[]>([]);
  const [isLoading, setIsLoading] = useState(!!user);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    documentsApi
      .listMine()
      .then((result) => {
        if (!cancelled) setDocuments(result as MyDocument[]);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load your documents.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) {
    return (
      <EmptyState
        title="Sign in to see your documents"
        action={<ButtonLink href="/login?next=/dashboard">Sign in</ButtonLink>}
      />
    );
  }
  if (isLoading) return <Loading label="Loading your documents…" />;
  if (error) {
    return (
      <Alert tone="danger" role="alert">
        {error}
      </Alert>
    );
  }
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
