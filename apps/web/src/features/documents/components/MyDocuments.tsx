"use client";

import type { GeneratedDocument, Template } from "@pratikar/types";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/shared/providers/AuthProvider";

import { documentsApi } from "../api/documentsApi";

import { GeneratedDocumentActions } from "./GeneratedDocumentActions";

/** listMine joins the template so a row can be labelled and priced. */
type MyDocument = GeneratedDocument & {
  template: Pick<Template, "title" | "priceInPaise" | "reviewPriceInPaise">;
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
      <p>
        <Link href="/login">Sign in</Link> to see your documents.
      </p>
    );
  }
  if (isLoading) return <p>Loading your documents…</p>;
  if (error) return <p role="alert">{error}</p>;
  if (documents.length === 0) {
    return (
      <p>
        You haven&apos;t generated any documents yet.{" "}
        <Link href="/documents">Start from a template</Link>.
      </p>
    );
  }

  return (
    <ul>
      {documents.map((doc) => (
        <li key={doc.id}>
          <h3>{doc.template.title}</h3>
          <p>
            <small>
              Generated {new Date(doc.createdAt).toLocaleDateString("en-IN")}
            </small>
          </p>
          <GeneratedDocumentActions
            documentId={doc.id}
            template={doc.template}
            initialStatus={doc.status}
          />
        </li>
      ))}
    </ul>
  );
}
