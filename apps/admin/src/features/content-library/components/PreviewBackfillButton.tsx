"use client";

import { Button } from "@pratikar/ui";
import { useState } from "react";

import { contentLibraryApi } from "../api/contentLibraryApi";

/**
 * Starts the free excerpts for published items that don't have one — the
 * library catalogued before previews existed. New and edited items get theirs
 * on their own; this is for catching up, and safe to press twice.
 */
export function PreviewBackfillButton() {
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "busy" }
    | { kind: "done"; queued: number }
    | { kind: "error" }
  >({ kind: "idle" });

  const start = () => {
    setState({ kind: "busy" });
    contentLibraryApi
      .backfillPreviews()
      .then(({ queued }) => setState({ kind: "done", queued }))
      .catch(() => setState({ kind: "error" }));
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        variant="secondary"
        onClick={start}
        disabled={state.kind === "busy"}
      >
        {state.kind === "busy" ? "Starting…" : "Make previews"}
      </Button>
      <p role="status" className="text-xs text-ink-muted">
        {state.kind === "done"
          ? state.queued > 0
            ? `${state.queued} previews queued — they appear over the next while.`
            : "Every published item already has a preview."
          : state.kind === "error"
            ? "Couldn't start. Try again."
            : ""}
      </p>
    </div>
  );
}
