"use client";

import { useEffect, useState } from "react";

import { documentsApi } from "../api/documentsApi";

/** How often to ask whether generation has finished, and for how long. */
const POLL_MS = 2000;
const GIVE_UP_MS = 90_000;

export type PreviewState =
  | { status: "loading" }
  | { status: "ready"; pages: string[] }
  | { status: "slow" }
  | { status: "error" };

/**
 * The preview of one generated document, waiting for the worker if it hasn't
 * finished. Filling and converting take a few seconds, so the first answer
 * is often "not yet" — this keeps asking, quietly, until it is.
 */
export function useDocumentPreview(documentId: string): PreviewState {
  const [state, setState] = useState<PreviewState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const startedAt = Date.now();

    const ask = () => {
      documentsApi
        .preview(documentId)
        .then((preview) => {
          if (cancelled) return;
          if (preview.ready) {
            setState({ status: "ready", pages: preview.pages });
          } else if (Date.now() - startedAt > GIVE_UP_MS) {
            setState({ status: "slow" });
          } else {
            timer = setTimeout(ask, POLL_MS);
          }
        })
        .catch(() => {
          if (!cancelled) setState({ status: "error" });
        });
    };

    setState({ status: "loading" });
    ask();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [documentId]);

  return state;
}
