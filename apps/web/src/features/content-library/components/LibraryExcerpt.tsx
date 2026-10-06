"use client";

import { Skeleton } from "@pratikar/ui";
import { Eye } from "lucide-react";
import { useEffect, useState } from "react";

import { Icon } from "@/shared/components/Icon";

import { contentLibraryApi } from "../api/contentLibraryApi";

/** How often to ask while the excerpt is made, and for how long. */
const POLL_MS = 3000;
const GIVE_UP_MS = 60_000;

type Excerpt =
  | { status: "loading" }
  | { status: "ready"; pages: string[] }
  | { status: "unavailable" };

/**
 * The free excerpt of a library item — its first pages, watermarked
 * (docs/srs.md 3.4: "preview is free; full download is pay-per-item").
 *
 * The first visit to an item may find it not yet rendered; the server
 * starts on it then, and this waits a little. If it still isn't ready, or
 * the file can't be previewed, the section simply leaves itself out — the
 * page is complete without it.
 */
export function LibraryExcerpt({
  itemId,
  title,
}: {
  itemId: string;
  title: string;
}) {
  const [excerpt, setExcerpt] = useState<Excerpt>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const startedAt = Date.now();

    const ask = () => {
      contentLibraryApi
        .preview(itemId)
        .then((preview) => {
          if (cancelled) return;
          if (preview.ready) {
            setExcerpt(
              preview.pages.length > 0
                ? { status: "ready", pages: preview.pages }
                : { status: "unavailable" },
            );
          } else if (Date.now() - startedAt > GIVE_UP_MS) {
            setExcerpt({ status: "unavailable" });
          } else {
            timer = setTimeout(ask, POLL_MS);
          }
        })
        .catch(() => {
          if (!cancelled) setExcerpt({ status: "unavailable" });
        });
    };
    ask();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [itemId]);

  if (excerpt.status === "unavailable") return null;

  return (
    <section
      aria-labelledby="excerpt-title"
      className="mt-12 border-t border-line pt-10"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2
          id="excerpt-title"
          className="flex items-center gap-2 text-xl font-semibold"
        >
          <Icon icon={Eye} className="text-primary" />
          Inside this item
        </h2>
        <p className="text-sm text-ink-muted">
          The first pages, watermarked — the file you download is clean.
        </p>
      </div>

      {excerpt.status === "loading" ? (
        <div role="status" aria-busy="true" className="mt-5">
          <span className="sr-only">Loading a preview…</span>
          <Skeleton className="aspect-[1/1.414] w-full max-w-sm" />
        </div>
      ) : (
        <ol className="mt-5 grid gap-4 sm:grid-cols-2">
          {excerpt.pages.map((src, index) => (
            <li key={src}>
              {/* Signed, short-lived links the API streams; next/image's
                  optimiser has nothing to add. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`${title}, page ${index + 1}`}
                loading="lazy"
                draggable={false}
                onContextMenu={(event) => event.preventDefault()}
                className="w-full select-none rounded-control border border-line bg-surface shadow-card"
              />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
