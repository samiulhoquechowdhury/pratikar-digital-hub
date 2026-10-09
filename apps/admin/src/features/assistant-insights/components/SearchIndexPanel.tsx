"use client";

import { Role } from "@pratikar/types";
import { Alert, Button, Card } from "@pratikar/ui";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/shared/providers/AuthProvider";

import { knowledgeBaseApi, type IndexStatus } from "../api/knowledgeBaseApi";

/** How often to check while a rebuild is working through the queue. */
const POLL_MS = 5000;

/**
 * The assistant's catalogue search index: what's in it against what's
 * published, and a rebuild. Saves keep it current on their own; a rebuild
 * is for the first fill, after changing the search model, or as a repair.
 */
export function SearchIndexPanel() {
  const { user } = useAuth();
  const canRebuild =
    user?.role === Role.ADMIN || user?.role === Role.SUPER_ADMIN;
  const [status, setStatus] = useState<IndexStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rebuilding, setRebuilding] = useState(false);

  const load = useCallback(async () => {
    try {
      setStatus(await knowledgeBaseApi.status());
      setError(null);
    } catch {
      setError("Couldn't load the search index status.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Keep the numbers moving while a rebuild runs.
  useEffect(() => {
    if (!status || status.pending === 0) return;
    const timer = window.setTimeout(() => void load(), POLL_MS);
    return () => window.clearTimeout(timer);
  }, [status, load]);

  const rebuild = async () => {
    setRebuilding(true);
    setError(null);
    try {
      await knowledgeBaseApi.rebuild();
      await load();
    } catch {
      setError("Couldn't start the rebuild.");
    } finally {
      setRebuilding(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Search index</h2>
          <p className="mt-1 max-w-prose text-sm text-ink-muted">
            What the assistant can find and recommend. It updates by itself
            whenever something is published or edited.
          </p>
        </div>
        {canRebuild && (
          <Button
            variant="secondary"
            onClick={() => void rebuild()}
            loading={rebuilding}
            loadingLabel="Starting…"
            disabled={!status?.configured || (status?.pending ?? 0) > 0}
          >
            Rebuild index
          </Button>
        )}
      </div>

      {error && (
        <div className="mt-4">
          <Alert tone="danger" role="alert">
            {error}
          </Alert>
        </div>
      )}

      {status && !status.configured && (
        <div className="mt-4">
          <Alert tone="warning">
            Search isn&apos;t configured — set VOYAGE_API_KEY on the server.
          </Alert>
        </div>
      )}

      {status && (
        <>
          <dl className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {status.sources.map((source) => {
              const behind = source.indexed < source.published;
              return (
                <div
                  key={source.type}
                  className={`rounded-card border p-4 ${behind ? "border-warning-text/30" : "border-line"}`}
                >
                  <dt className="text-sm text-ink-muted">{source.label}</dt>
                  <dd className="mt-1 text-xl font-semibold tabular-nums text-ink">
                    {source.indexed}
                    <span className="text-sm font-normal text-ink-subtle">
                      {" "}
                      / {source.published} published
                    </span>
                  </dd>
                </div>
              );
            })}
          </dl>
          <p role="status" className="mt-3 text-xs text-ink-subtle">
            {status.pending > 0
              ? `Updating — ${status.pending} items still to process…`
              : status.lastUpdated
                ? `Up to date · last change ${new Date(status.lastUpdated).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · ${status.model}`
                : "Empty."}
            {status.failed > 0 && ` · ${status.failed} failed — try a rebuild.`}
          </p>
        </>
      )}
    </Card>
  );
}
