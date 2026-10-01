"use client";

import type { TemplateFieldType } from "@pratikar/types";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Loading,
  Select,
} from "@pratikar/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  templatesApi,
  type TaggableListing,
  type TaggableObject,
} from "../api/templatesApi";
import { FIELD_TYPES, rupeesToPaise } from "../lib/fieldSchema";
import {
  groupByFolder,
  hasProblems,
  matchesSearch,
  setAllIncluded,
  toPayloadFields,
  toRows,
  updateRow,
  validateRows,
  type BlankRow,
} from "../lib/tagging";

/**
 * Turns a fill-in-the-blank form already in storage into a template the
 * generator can fill.
 *
 * The documents in the bucket are print-and-fill forms: an affidavit with
 * eleven runs of underscores where a name, a date and an address go. Selling
 * one is a download. Turning one into a template means naming each of those
 * blanks, and that naming is the entire job this screen exists to do — the
 * API can find the blanks and guess at them, but only a person knows that the
 * second blank is the father's name and not the deponent's.
 *
 * One screen, two steps: pick the form, then name its blanks. They aren't
 * separate routes because the second step is meaningless without the first
 * and nobody arrives at it from anywhere else.
 */
export function TemplateFromStorage() {
  const router = useRouter();

  const [listing, setListing] = useState<TaggableListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [picked, setPicked] = useState<TaggableObject | null>(null);
  const [rows, setRows] = useState<BlankRow[]>([]);
  const [isReading, setIsReading] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [reviewPrice, setReviewPrice] = useState("");

  const [showProblems, setShowProblems] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await templatesApi.listTaggable();
        if (!cancelled) {
          setListing(data);
          setLoadError(null);
        }
      } catch {
        if (!cancelled) {
          setLoadError(
            "Couldn't read storage. If R2 isn't configured the API falls back to local disk, which will be empty.",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const groups = useMemo(() => {
    const objects = (listing?.objects ?? []).filter((object) =>
      matchesSearch(object, search),
    );
    return groupByFolder(objects);
  }, [listing, search]);

  const pick = useCallback(async (object: TaggableObject) => {
    setIsReading(true);
    setFormError(null);
    setShowProblems(false);
    try {
      const { blanks } = await templatesApi.readBlanks(object.key);
      setPicked(object);
      setRows(toRows(blanks));
      // The catalogue's title is a good default — it was derived from the
      // same filename, and it is what the form is already sold under.
      setTitle(object.suggestedTitle);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Couldn't read that file's blanks.",
      );
    } finally {
      setIsReading(false);
    }
  }, []);

  const reset = () => {
    setPicked(null);
    setRows([]);
    setShowProblems(false);
    setFormError(null);
  };

  const problems = useMemo(() => validateRows(rows), [rows]);
  const includedCount = rows.filter((row) => row.include).length;

  const priceInPaise = rupeesToPaise(price);
  const reviewPriceInPaise = rupeesToPaise(reviewPrice);

  const save = async () => {
    setFormError(null);

    if (!picked) return;
    if (!title.trim() || !category.trim()) {
      setFormError("Title and category are required.");
      return;
    }
    if (priceInPaise === null || reviewPriceInPaise === null) {
      setFormError("Prices must be amounts of 0 or more, in rupees.");
      return;
    }

    setShowProblems(true);
    if (hasProblems(problems)) {
      setFormError("Fix the problems below before saving.");
      return;
    }

    setIsSaving(true);
    try {
      const template = await templatesApi.createFromStorage({
        storageKey: picked.key,
        title: title.trim(),
        category: category.trim(),
        priceInPaise,
        reviewPriceInPaise,
        fields: toPayloadFields(rows),
      });
      // Straight to the template, because the next thing to do is generate one
      // and look at it. It is saved as a draft either way — see the note below
      // the action bar.
      router.push(`/templates/${template.id}`);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Couldn't save the template.",
      );
      setIsSaving(false);
    }
  };

  /* ------------------------------------------------------------ step one */

  if (!picked) {
    if (isLoading) return <Loading label="Reading storage…" />;
    if (loadError) return <Alert tone="danger">{loadError}</Alert>;

    const total = listing?.objects.length ?? 0;

    return (
      <div className="space-y-6">
        {formError && (
          <Alert tone="danger" role="alert">
            {formError}
          </Alert>
        )}

        <Card className="p-4">
          <Field
            label="Find a form"
            htmlFor="storage-search"
            hint={
              listing && listing.skippedUnsupported > 0
                ? `${total} Word document${total === 1 ? "" : "s"}. ${listing.skippedUnsupported} other file${listing.skippedUnsupported === 1 ? "" : "s"} in the bucket aren't shown — blanks are read from the document's XML, so a PDF or a scan has nothing to tag.`
                : `${total} Word document${total === 1 ? "" : "s"} in storage.`
            }
          >
            <Input
              id="storage-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="affidavit, agreements/, notice…"
            />
          </Field>
        </Card>

        {isReading && <Loading label="Reading the document's blanks…" />}

        {groups.length === 0 ? (
          <EmptyState
            title={search ? "Nothing matches that" : "No Word documents found"}
            description={
              search
                ? "Try a folder name, or part of the document's title."
                : "Upload the forms to object storage first — this screen builds templates from what is already there."
            }
          />
        ) : (
          groups.map((group) => (
            <section key={group.folder}>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-muted">
                {group.folder}{" "}
                <span className="font-normal normal-case tracking-normal">
                  ({group.objects.length})
                </span>
              </h2>
              <Card className="divide-y divide-line">
                {group.objects.map((object) => (
                  <div
                    key={object.key}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-base font-medium text-ink">
                        {object.suggestedTitle}
                      </p>
                      <p className="truncate text-sm text-ink-subtle">
                        {object.key}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {object.template && (
                        // Not a blocker — a long version and a short version of
                        // the same form are both legitimate. It is here so the
                        // far likelier case, doing the work twice by accident,
                        // is visible before it starts.
                        <Link
                          href={`/templates/${object.template.id}`}
                          className="text-sm text-ink-muted underline"
                        >
                          <Badge tone="brand">
                            Already a template: {object.template.title}
                          </Badge>
                        </Link>
                      )}
                      <Button
                        variant="secondary"
                        onClick={() => void pick(object)}
                        disabled={isReading}
                      >
                        Read blanks
                      </Button>
                    </div>
                  </div>
                ))}
              </Card>
            </section>
          ))
        )}
      </div>
    );
  }

  /* ------------------------------------------------------------ step two */

  return (
    <div className="space-y-6 pb-28">
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="truncate text-base font-medium text-ink">
            {picked.suggestedTitle}
          </p>
          <p className="truncate text-sm text-ink-subtle">{picked.key}</p>
        </div>
        <Button variant="ghost" onClick={reset}>
          Pick a different form
        </Button>
      </Card>

      {formError && (
        <Alert tone="danger" role="alert">
          {formError}
        </Alert>
      )}
      {showProblems &&
        problems.general.map((message) => (
          <Alert key={message} tone="danger" role="alert">
            {message}
          </Alert>
        ))}

      {rows.length === 0 ? (
        <EmptyState
          title="No blanks in this document"
          description="Blanks are runs of three or more underscores. This file may already use {tags}, or it may be a finished document rather than a form — either way there is nothing here to name."
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-ink">
              {rows.length} blank{rows.length === 1 ? "" : "s"} found
              <span className="ml-2 text-sm font-normal text-ink-muted">
                {includedCount} will become fields
              </span>
            </h2>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setRows(setAllIncluded(rows, true))}
              >
                Include all
              </Button>
              <Button
                variant="ghost"
                onClick={() => setRows(setAllIncluded(rows, false))}
              >
                Include none
              </Button>
            </div>
          </div>

          <p className="text-sm text-ink-muted">
            Each row is one run of underscores, shown with the words around it.
            The name becomes the <code>{"{tag}"}</code> written into the
            document, so it has to be unique. Anything left unticked stays as
            underscores — still printable, still fillable by hand.
          </p>

          <ul className="space-y-3">
            {rows.map((row) => {
              const rowProblems = showProblems
                ? (problems.byRow.get(row.index) ?? [])
                : [];
              return (
                <li key={row.index}>
                  <Card
                    className={`p-4 ${row.include ? "" : "bg-surface-sunken"}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id={`include-${row.index}`}
                        checked={row.include}
                        onChange={(e) =>
                          setRows(
                            updateRow(rows, row.index, {
                              include: e.target.checked,
                            }),
                          )
                        }
                        className="mt-1 h-4 w-4 shrink-0 rounded border-line-strong"
                      />
                      <div className="min-w-0 flex-1 space-y-3">
                        <label
                          htmlFor={`include-${row.index}`}
                          className="block text-sm leading-relaxed text-ink-muted"
                        >
                          <span className="text-ink-subtle">…</span>
                          {row.before}
                          <span className="mx-1 rounded bg-brand-subtle px-2 py-0.5 font-mono text-xs text-gold-ink">
                            {row.width} underscores
                          </span>
                          {row.after}
                          <span className="text-ink-subtle">…</span>
                        </label>

                        {row.include && (
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <Field
                              label="Name"
                              htmlFor={`key-${row.index}`}
                              hint="Becomes {tag}"
                            >
                              <Input
                                id={`key-${row.index}`}
                                value={row.key}
                                onChange={(e) =>
                                  setRows(
                                    updateRow(rows, row.index, {
                                      key: e.target.value,
                                    }),
                                  )
                                }
                              />
                            </Field>
                            <Field
                              label="Label"
                              htmlFor={`label-${row.index}`}
                              hint="What the customer sees"
                            >
                              <Input
                                id={`label-${row.index}`}
                                value={row.label}
                                onChange={(e) =>
                                  setRows(
                                    updateRow(rows, row.index, {
                                      label: e.target.value,
                                    }),
                                  )
                                }
                              />
                            </Field>
                            <Field label="Type" htmlFor={`type-${row.index}`}>
                              <Select
                                id={`type-${row.index}`}
                                value={row.type}
                                onChange={(e) =>
                                  setRows(
                                    updateRow(rows, row.index, {
                                      type: e.target.value as TemplateFieldType,
                                    }),
                                  )
                                }
                              >
                                {FIELD_TYPES.map((type) => (
                                  <option key={type} value={type}>
                                    {type}
                                  </option>
                                ))}
                              </Select>
                            </Field>
                            <div className="flex items-end pb-2">
                              <label className="flex items-center gap-2 text-sm text-ink">
                                <input
                                  type="checkbox"
                                  checked={row.required}
                                  onChange={(e) =>
                                    setRows(
                                      updateRow(rows, row.index, {
                                        required: e.target.checked,
                                      }),
                                    )
                                  }
                                  className="h-4 w-4 rounded border-line-strong"
                                />
                                Required
                              </label>
                            </div>
                          </div>
                        )}

                        {rowProblems.map((message) => (
                          <p
                            key={message}
                            role="alert"
                            className="text-sm text-danger-text"
                          >
                            {message}
                          </p>
                        ))}
                      </div>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <Card className="space-y-4 p-4">
        <h2 className="text-lg font-semibold text-ink">Template details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" htmlFor="tpl-title">
            <Input
              id="tpl-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field
            label="Category"
            htmlFor="tpl-category"
            hint="Groups it on the storefront."
          >
            <Input
              id="tpl-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="property, affidavits, business…"
            />
          </Field>
          <Field
            label="Price (₹)"
            htmlFor="tpl-price"
            hint="What a customer pays to generate this document."
            error={
              price.trim() && priceInPaise === null
                ? "Enter an amount of 0 or more."
                : undefined
            }
          >
            <Input
              id="tpl-price"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </Field>
          <Field
            label="Review price (₹)"
            htmlFor="tpl-review-price"
            hint="What a lawyer's review of it costs on top."
            error={
              reviewPrice.trim() && reviewPriceInPaise === null
                ? "Enter an amount of 0 or more."
                : undefined
            }
          >
            <Input
              id="tpl-review-price"
              inputMode="decimal"
              value={reviewPrice}
              onChange={(e) => setReviewPrice(e.target.value)}
            />
          </Field>
        </div>
      </Card>

      {/*
        Sticky, because the blanks list runs past a screen on every real form
        and the save button being at the bottom of nineteen rows is a scroll
        each time something above it is corrected.
      */}
      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-muted">
            Saved as a <strong className="text-ink">draft</strong> — generate
            one and read it before putting it on sale. The original form is not
            modified; the tagged copy is written beside it.
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={reset} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              onClick={() => void save()}
              disabled={isSaving || rows.length === 0}
            >
              {isSaving ? "Saving…" : "Create draft template"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
