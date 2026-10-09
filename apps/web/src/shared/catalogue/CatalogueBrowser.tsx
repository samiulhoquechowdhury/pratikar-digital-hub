"use client";

import { Alert, EmptyState, Skeleton } from "@pratikar/ui";
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { Icon } from "../components/Icon";

import { browse, pageWindow, type FacetDef, type SortDef } from "./browse";
import { useBrowseParams, type BrowseView } from "./useBrowseParams";

/** Items per page. Enough to fill a screen or two in either view. */
const PAGE_SIZE = 24;
/** Options a facet shows before "Show all". */
const FACET_PREVIEW = 8;

export interface CatalogueBrowserProps<T> {
  items: T[];
  isLoading: boolean;
  error?: string | null;
  facets: FacetDef<T>[];
  sorts: SortDef<T>[];
  /** The text the search looks in. */
  searchText: (item: T) => string;
  searchPlaceholder: string;
  /** What these things are called, for "330 forms" — singular and plural. */
  noun: [string, string];
  keyOf: (item: T) => string;
  renderRow: (item: T) => ReactNode;
  renderCard: (item: T) => ReactNode;
  defaultView?: BrowseView;
  /** Shown when the catalogue itself is empty, not just the filter. */
  emptyTitle: string;
  emptyDescription: string;
}

/**
 * Faceted browsing for a catalogue of hundreds — the library's forms,
 * checklists and e-books, the document templates.
 *
 * Built around how people actually look for a legal document: they know
 * roughly what it's called or what it's for, so search leads, filters
 * narrow, and results are compact enough to scan by title. On a wide screen
 * the filters sit in a sticky sidebar beside the results instead of above
 * them; on a phone they open in a sheet. Every choice is in the URL.
 */
export function CatalogueBrowser<T>({
  items,
  isLoading,
  error,
  facets,
  sorts,
  searchText,
  searchPlaceholder,
  noun,
  keyOf,
  renderRow,
  renderCard,
  defaultView = "list",
  emptyTitle,
  emptyDescription,
}: CatalogueBrowserProps<T>) {
  const facetIds = useMemo(() => facets.map((f) => f.id), [facets]);
  const { params, update } = useBrowseParams(facetIds, {
    sort: sorts[0]?.id ?? "",
    view: defaultView,
  });
  const [sheetOpen, setSheetOpen] = useState(false);
  const resultsTop = useRef<HTMLDivElement>(null);

  const result = useMemo(
    () =>
      browse(
        items,
        {
          q: params.q,
          filters: params.filters,
          sort: params.sort,
          page: params.page,
          pageSize: PAGE_SIZE,
        },
        { facets, sorts, searchText },
      ),
    [items, params, facets, sorts, searchText],
  );

  const activeCount = Object.keys(params.filters).length;
  const setFilter = (facetId: string, value: string | null) => {
    const filters = { ...params.filters };
    if (value) filters[facetId] = value;
    else delete filters[facetId];
    update({ filters });
  };

  const goToPage = (page: number) => {
    update({ page });
    resultsTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (error) {
    return (
      <Alert tone="danger" role="alert">
        {error}
      </Alert>
    );
  }
  if (!isLoading && items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  const facetPanel = (
    <FacetPanel
      facets={facets}
      counts={result.counts}
      filters={params.filters}
      onChange={setFilter}
      onClear={activeCount > 0 ? () => update({ filters: {} }) : undefined}
    />
  );

  return (
    <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
      {/* Filters beside the results, held in view while they scroll. */}
      <aside aria-label="Filters" className="hidden lg:block">
        <div className="sticky top-[8.5rem] max-h-[calc(100dvh-10rem)] overflow-y-auto pb-6 pr-2">
          {facetPanel}
        </div>
      </aside>

      <div className="min-w-0">
        <div
          ref={resultsTop}
          className="sticky top-16 z-20 -mx-4 scroll-mt-24 border-b border-line bg-surface/95 px-4 pb-3 pt-3 backdrop-blur supports-[backdrop-filter]:bg-surface/85 sm:-mx-6 sm:px-6 lg:top-[6.75rem] lg:mx-0 lg:scroll-mt-32 lg:border-b-0 lg:px-0"
        >
          <div className="flex gap-2">
            <SearchBox
              value={params.q}
              placeholder={searchPlaceholder}
              onChange={(q) => update({ q }, "replace")}
            />
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="inline-flex h-12 shrink-0 items-center gap-2 rounded-control border border-line-strong bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-sunken lg:hidden"
            >
              <Icon icon={SlidersHorizontal} />
              Filters
              {activeCount > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-xs text-ink-inverse">
                  {activeCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <ResultsBar
          total={result.total}
          noun={noun}
          q={params.q}
          facets={facets}
          filters={params.filters}
          onRemoveFilter={(id) => setFilter(id, null)}
          onClearQuery={() => update({ q: "" })}
          sorts={sorts}
          sort={params.sort}
          onSort={(sort) => update({ sort })}
          view={params.view}
          onView={(view) => update({ view }, "replace")}
        />

        {isLoading ? (
          <ResultsSkeleton view={params.view} />
        ) : result.total === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="Nothing matches"
              description={
                params.q
                  ? "Try fewer or different words, or clear a filter."
                  : "Try clearing a filter."
              }
            />
          </div>
        ) : params.view === "list" ? (
          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
            {result.items.map((item) => (
              <li key={keyOf(item)}>{renderRow(item)}</li>
            ))}
          </ul>
        ) : (
          <ul className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {result.items.map((item) => (
              <li key={keyOf(item)}>{renderCard(item)}</li>
            ))}
          </ul>
        )}

        {result.pageCount > 1 && (
          <Pager
            page={result.page}
            pageCount={result.pageCount}
            onPage={goToPage}
            total={result.total}
          />
        )}
      </div>

      {sheetOpen && (
        <FilterSheet
          onClose={() => setSheetOpen(false)}
          total={result.total}
          noun={noun}
        >
          {facetPanel}
        </FilterSheet>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── search box */

/**
 * The search field. Typing filters as you go, a moment after you stop —
 * not on every key, which would rewrite the URL dozens of times a word.
 */
function SearchBox({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const [text, setText] = useState(value);
  const latest = useRef(onChange);
  latest.current = onChange;

  // Back/forward, or a cleared chip, changes the URL under the box.
  useEffect(() => setText(value), [value]);

  useEffect(() => {
    if (text === value) return;
    const timer = setTimeout(() => latest.current(text), 250);
    return () => clearTimeout(timer);
  }, [text, value]);

  return (
    <div className="relative flex-1">
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <Icon
        icon={Search}
        size="md"
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-subtle"
      />
      <input
        id={id}
        type="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="h-12 w-full rounded-control border border-line-strong bg-surface pl-12 pr-4 text-base text-ink shadow-card placeholder:text-ink-subtle transition-colors hover:border-ink-subtle focus:border-primary"
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── facets */

function FacetPanel<T>({
  facets,
  counts,
  filters,
  onChange,
  onClear,
}: {
  facets: FacetDef<T>[];
  counts: Record<string, Record<string, number>>;
  filters: Record<string, string>;
  onChange: (facetId: string, value: string | null) => void;
  onClear?: () => void;
}) {
  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">Filter by</p>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-sm font-medium text-primary hover:underline"
          >
            Clear all
          </button>
        )}
      </div>
      {facets.map((facet) => (
        <Facet
          key={facet.id}
          facet={facet}
          counts={counts[facet.id] ?? {}}
          selected={filters[facet.id] ?? null}
          onChange={(value) => onChange(facet.id, value)}
        />
      ))}
    </div>
  );
}

/**
 * One facet: "All", then each option with how many results choosing it
 * would give. Options with none stay listed but can't be chosen — a filter
 * that leads to an empty page is a dead end, but hiding it would make the
 * list jump about as other filters change.
 */
function Facet<T>({
  facet,
  counts,
  selected,
  onChange,
}: {
  facet: FacetDef<T>;
  counts: Record<string, number>;
  selected: string | null;
  onChange: (value: string | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const options = facet.options.filter(
    (o) => (counts[o.value] ?? 0) > 0 || o.value === selected,
  );
  // Keep the chosen option visible even when it's beyond the preview.
  const shown =
    expanded || options.length <= FACET_PREVIEW
      ? options
      : options.filter((o, i) => i < FACET_PREVIEW || o.value === selected);

  // A filter offering a single choice narrows nothing — hide it until the
  // catalogue (or the other filters) gives it at least two.
  const live = facet.options.filter((o) => (counts[o.value] ?? 0) > 0);
  if (live.length < 2 && selected === null) return null;

  return (
    <fieldset>
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
        {facet.label}
      </legend>
      <ul className="space-y-0.5">
        <FacetOption
          label="All"
          count={total}
          active={selected === null}
          onClick={() => onChange(null)}
        />
        {shown.map((option) => (
          <FacetOption
            key={option.value}
            label={option.label}
            count={counts[option.value] ?? 0}
            active={selected === option.value}
            onClick={() =>
              onChange(selected === option.value ? null : option.value)
            }
          />
        ))}
      </ul>
      {options.length > FACET_PREVIEW && (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="mt-2 px-3 text-sm font-medium text-primary hover:underline"
        >
          {expanded ? "Show fewer" : `Show all ${options.length}`}
        </button>
      )}
    </fieldset>
  );
}

function FacetOption({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={active}
        onClick={onClick}
        className={`flex w-full items-center gap-3 rounded-control px-3 py-2 text-left text-sm transition-colors ${
          active
            ? "bg-primary-subtle font-semibold text-primary"
            : "text-ink hover:bg-surface-sunken"
        }`}
      >
        <span
          aria-hidden
          className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
            active ? "border-primary" : "border-line-strong"
          }`}
        >
          {active && <span className="h-2 w-2 rounded-full bg-primary" />}
        </span>
        <span className="flex-1">{label}</span>
        <span
          className={`text-xs tabular-nums ${active ? "text-primary" : "text-ink-subtle"}`}
        >
          {count}
        </span>
      </button>
    </li>
  );
}

/* ───────────────────────────────────────────────────────── results bar */

function ResultsBar<T>({
  total,
  noun,
  q,
  facets,
  filters,
  onRemoveFilter,
  onClearQuery,
  sorts,
  sort,
  onSort,
  view,
  onView,
}: {
  total: number;
  noun: [string, string];
  q: string;
  facets: FacetDef<T>[];
  filters: Record<string, string>;
  onRemoveFilter: (facetId: string) => void;
  onClearQuery: () => void;
  sorts: SortDef<T>[];
  sort: string;
  onSort: (sort: string) => void;
  view: BrowseView;
  onView: (view: BrowseView) => void;
}) {
  const sortId = useId();
  const chips = facets.flatMap((facet) => {
    const value = filters[facet.id];
    const option = facet.options.find((o) => o.value === value);
    return option ? [{ facetId: facet.id, label: option.label }] : [];
  });

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted" aria-live="polite">
          <span className="font-semibold text-ink">
            {total.toLocaleString("en-IN")}
          </span>{" "}
          {total === 1 ? noun[0] : noun[1]}
          {q.trim() && (
            <>
              {" "}
              for <span className="font-semibold text-ink">“{q.trim()}”</span>
            </>
          )}
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor={sortId} className="sr-only">
            Sort by
          </label>
          <select
            id={sortId}
            value={sort}
            onChange={(event) => onSort(event.target.value)}
            className="h-9 rounded-control border border-line-strong bg-surface px-2 text-sm text-ink"
          >
            {sorts.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <div
            role="group"
            aria-label="View"
            className="inline-flex rounded-control border border-line-strong bg-surface p-0.5"
          >
            {(
              [
                ["list", List, "List view"],
                ["grid", LayoutGrid, "Grid view"],
              ] as const
            ).map(([value, icon, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={view === value}
                onClick={() => onView(value)}
                className={`grid h-8 w-8 place-items-center rounded-[0.375rem] transition-colors ${
                  view === value
                    ? "bg-primary text-ink-inverse"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                <Icon icon={icon} label={label} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {(chips.length > 0 || q.trim()) && (
        <ul className="flex flex-wrap gap-2" aria-label="Active filters">
          {q.trim() && <Chip label={`“${q.trim()}”`} onRemove={onClearQuery} />}
          {chips.map((chip) => (
            <Chip
              key={chip.facetId}
              label={chip.label}
              onRemove={() => onRemoveFilter(chip.facetId)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onRemove}
        className="inline-flex items-center gap-1.5 rounded-full border border-primary-border bg-primary-subtle py-1 pl-3 pr-2 text-sm font-medium text-primary transition-colors hover:border-primary"
      >
        {label}
        <Icon icon={X} size="xs" label={`Remove ${label}`} />
      </button>
    </li>
  );
}

/* ─────────────────────────────────────────────────────────── pager */

function Pager({
  page,
  pageCount,
  total,
  onPage,
}: {
  page: number;
  pageCount: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  const step =
    "grid h-10 min-w-10 place-items-center rounded-control px-3 text-sm font-medium transition-colors";

  return (
    <nav
      aria-label="Pages"
      className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-between"
    >
      <p className="text-sm text-ink-muted">
        Showing {from}–{to} of {total.toLocaleString("en-IN")}
      </p>
      <ul className="flex items-center gap-1">
        <li>
          <button
            type="button"
            disabled={page === 1}
            onClick={() => onPage(page - 1)}
            className={`${step} text-ink hover:bg-surface-sunken disabled:opacity-40`}
          >
            <Icon icon={ChevronLeft} label="Previous page" />
          </button>
        </li>
        {pageWindow(page, pageCount).map((p, index) =>
          p === null ? (
            <li
              key={`gap-${index}`}
              aria-hidden
              className="px-1 text-ink-subtle"
            >
              …
            </li>
          ) : (
            <li key={p}>
              <button
                type="button"
                aria-current={p === page ? "page" : undefined}
                onClick={() => onPage(p)}
                className={`${step} ${
                  p === page
                    ? "bg-primary text-ink-inverse"
                    : "text-ink hover:bg-surface-sunken"
                }`}
              >
                <span className="sr-only">Page </span>
                {p}
              </button>
            </li>
          ),
        )}
        <li>
          <button
            type="button"
            disabled={page === pageCount}
            onClick={() => onPage(page + 1)}
            className={`${step} text-ink hover:bg-surface-sunken disabled:opacity-40`}
          >
            <Icon icon={ChevronRight} label="Next page" />
          </button>
        </li>
      </ul>
    </nav>
  );
}

/* ─────────────────────────────────────────────────── mobile filter sheet */

/**
 * The filters on a phone: a sheet over the page, closed by its button,
 * the backdrop or Escape, ending in the number of results it will show —
 * so nobody has to close it to find out whether a filter helped.
 */
function FilterSheet({
  onClose,
  total,
  noun,
  children,
}: {
  onClose: () => void;
  total: number;
  noun: [string, string];
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close filters"
        onClick={onClose}
        className="absolute inset-0 bg-surface-inverse-deep/50"
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-[1.25rem] bg-surface shadow-overlay outline-none"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id={titleId} className="text-lg font-semibold">
            Filters
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-control text-ink-muted hover:bg-surface-sunken"
          >
            <Icon icon={X} size="md" label="Close filters" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        <div className="border-t border-line p-4">
          <button
            type="button"
            onClick={onClose}
            className="h-12 w-full rounded-control bg-primary text-sm font-semibold text-ink-inverse transition-colors hover:bg-primary-hover"
          >
            Show {total.toLocaleString("en-IN")}{" "}
            {total === 1 ? noun[0] : noun[1]}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── loading */

function ResultsSkeleton({ view }: { view: BrowseView }) {
  return (
    <div role="status" aria-busy="true" className="mt-4">
      <span className="sr-only">Loading…</span>
      {view === "list" ? (
        <div className="divide-y divide-line rounded-card border border-line">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <Skeleton className="h-11 w-11" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-5 w-14" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      )}
    </div>
  );
}
