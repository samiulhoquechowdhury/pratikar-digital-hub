"use client";

import {
  Alert,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Select,
  SkeletonList,
} from "@pratikar/ui";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  CONTENT_CATEGORIES,
  CONTENT_TYPES,
  contentLibraryApi,
  type ContentCategory,
  type ContentType,
  type StorageListing,
} from "../api/contentLibraryApi";
import {
  folderState,
  groupByFolder,
  rupeesToPaise,
  toggleFolder,
} from "../lib/importSelection";

/**
 * Turns files already in object storage into catalogue items.
 *
 * The bucket was filled directly — hundreds of documents that exist but
 * cannot be bought, because the storefront lists rows and a row needs a
 * title, a category and a price. Nothing is uploaded here; each import
 * writes a row pointing at a key that is already there.
 *
 * Organised by folder rather than as one list of hundreds, because that is
 * how the files were organised and how the pricing decisions actually fall —
 * all affidavits at one price, all e-books at another.
 */
export function StorageImport() {
  const [listing, setListing] = useState<StorageListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<string | null>(null);

  const [price, setPrice] = useState("99");
  const [category, setCategory] = useState<ContentCategory | "">("");
  const [type, setType] = useState<ContentType | "">("");
  const [publish, setPublish] = useState(false);

  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await contentLibraryApi.listStorage();
      setListing(data);
      setTitles(
        Object.fromEntries(data.objects.map((o) => [o.key, o.suggestedTitle])),
      );
      setError(null);
    } catch {
      setError(
        "Couldn't read storage. If R2 isn't configured the API falls back to local disk, which will be empty.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const groups = useMemo(
    () => groupByFolder(listing?.objects ?? []),
    [listing],
  );

  const paise = rupeesToPaise(price);
  const canImport = selected.size > 0 && paise !== null && !isImporting;

  const runImport = async () => {
    if (!listing || paise === null) return;
    setIsImporting(true);
    setResult(null);
    try {
      const items = listing.objects
        .filter((o) => selected.has(o.key))
        .map((o) => ({
          title: (titles[o.key] ?? o.suggestedTitle).trim(),
          // The per-folder suggestion is the default; the overrides above
          // apply to everything selected when they are set. No cast needed —
          // "" is falsy, so `||` already narrows away the empty case.
          category: category || o.category,
          type: type || o.type,
          priceInPaise: paise,
          fileUrl: o.key,
        }));

      const res = await contentLibraryApi.importFromStorage({ items, publish });
      setResult(
        `Imported ${res.created} item${res.created === 1 ? "" : "s"}` +
          (res.skipped > 0
            ? `, skipped ${res.skipped} already catalogued`
            : "") +
          (publish ? " — published." : " as drafts."),
      );
      setSelected(new Set());
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setIsImporting(false);
    }
  };

  if (isLoading) return <SkeletonList rows={5} label="Reading storage…" />;
  if (error && !listing) {
    return (
      <Alert tone="danger" role="alert">
        {error}
      </Alert>
    );
  }
  if (!listing || listing.objects.length === 0) {
    return (
      <EmptyState
        title="Nothing in storage yet"
        description="Files uploaded to the bucket appear here, ready to be given a title and a price."
      />
    );
  }

  const remaining = listing.objects.filter((o) => !o.catalogued).length;

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-sm text-ink">
            <span className="text-2xl font-semibold tabular-nums text-ink">
              {remaining}
            </span>{" "}
            of {listing.objects.length} files not yet catalogued
          </p>
          {listing.skippedUnsupported > 0 && (
            <p className="text-xs text-ink-subtle">
              {listing.skippedUnsupported} file
              {listing.skippedUnsupported === 1 ? "" : "s"} skipped — not a
              format a customer can open
            </p>
          )}
        </div>
      </Card>

      {/* Applied to everything selected. Blank means "keep each file's own
          suggestion", which is what makes a mixed selection safe. */}
      <Card className="p-5">
        <h2 className="text-base">Apply to selection</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field
            label="Price (₹)"
            htmlFor="price"
            hint="Same price for everything selected."
            error={
              paise === null ? "Enter an amount like 99 or 149.50" : undefined
            }
          >
            <Input
              id="price"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </Field>
          <Field
            label="Category"
            htmlFor="category"
            hint="Blank keeps each folder's suggestion."
          >
            <Select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ContentCategory)}
            >
              <option value="">Use suggestion</option>
              {CONTENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, " ").toLowerCase()}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Type" htmlFor="type" hint="Blank keeps the suggestion.">
            <Select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as ContentType)}
            >
              <option value="">Use suggestion</option>
              {CONTENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.toLowerCase()}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <label className="mt-4 flex items-start gap-2.5 text-sm text-ink">
          <input
            type="checkbox"
            checked={publish}
            onChange={(e) => setPublish(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-navy-800"
          />
          <span>
            Publish immediately
            <span className="mt-0.5 block text-xs text-ink-subtle">
              Off by default — imports land as drafts so you can review pricing
              before several hundred items appear on the storefront.
            </span>
          </span>
        </label>
      </Card>

      <div className="space-y-3">
        {groups.map((group) => {
          const state = folderState(selected, group);
          const isOpen = open === group.folder;
          return (
            <Card key={group.folder} className="overflow-hidden">
              <div className="flex flex-wrap items-center gap-3 border-b border-line bg-canvas px-4 py-3">
                <input
                  type="checkbox"
                  checked={state === "all"}
                  ref={(el) => {
                    if (el) el.indeterminate = state === "some";
                  }}
                  disabled={group.importableCount === 0}
                  onChange={(e) =>
                    setSelected(toggleFolder(selected, group, e.target.checked))
                  }
                  aria-label={`Select all in ${group.folder}`}
                  className="h-4 w-4 accent-navy-800 disabled:opacity-40"
                />
                <span className="font-medium text-ink">{group.folder}</span>
                <span className="text-sm text-ink-subtle">
                  {group.importableCount} to import
                  {group.cataloguedCount > 0 &&
                    ` · ${group.cataloguedCount} already done`}
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : group.folder)}
                  className="ml-auto text-sm font-medium text-primary hover:text-primary-hover"
                >
                  {isOpen ? "Hide files" : "Show files"}
                </button>
              </div>

              {isOpen && (
                <ul className="max-h-96 divide-y divide-line overflow-y-auto">
                  {group.objects.map((object) => (
                    <li
                      key={object.key}
                      className="flex items-center gap-3 px-4 py-2.5"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(object.key)}
                        disabled={object.catalogued}
                        onChange={(e) => {
                          const next = new Set(selected);
                          if (e.target.checked) next.add(object.key);
                          else next.delete(object.key);
                          setSelected(next);
                        }}
                        aria-label={`Select ${object.suggestedTitle}`}
                        className="h-4 w-4 shrink-0 accent-navy-800 disabled:opacity-40"
                      />
                      <Input
                        value={titles[object.key] ?? object.suggestedTitle}
                        onChange={(e) =>
                          setTitles({ ...titles, [object.key]: e.target.value })
                        }
                        disabled={object.catalogued}
                        className="py-1 text-sm"
                        aria-label={`Title for ${object.key}`}
                      />
                      {object.catalogued && (
                        <span className="shrink-0 text-xs font-medium text-success-text">
                          catalogued
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>

      {result && (
        <Alert tone="success" role="status">
          {result}{" "}
          <Link
            href="/content-library"
            className="font-semibold underline underline-offset-2"
          >
            See the catalogue
          </Link>
        </Alert>
      )}
      {error && listing && (
        <Alert tone="danger" role="alert">
          {error}
        </Alert>
      )}

      {/* Sticky: the selection is made by scrolling through folders, and a
          button at the bottom of 449 rows is a button nobody finds. */}
      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-4 border-t border-line bg-surface/95 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-card sm:border sm:px-5">
        <Button
          type="button"
          onClick={() => void runImport()}
          disabled={!canImport}
          loading={isImporting}
          loadingLabel="Importing…"
        >
          Import {selected.size > 0 ? `${selected.size} file` : "files"}
          {selected.size === 1 ? "" : selected.size > 0 ? "s" : ""}
        </Button>
        {selected.size > 0 && (
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-sm font-medium text-ink-muted hover:text-ink"
          >
            Clear selection
          </button>
        )}
        <span className="text-sm text-ink-subtle">
          {paise !== null
            ? `₹${price} each · ${publish ? "published" : "saved as drafts"}`
            : "Enter a valid price"}
        </span>
      </div>
    </div>
  );
}
