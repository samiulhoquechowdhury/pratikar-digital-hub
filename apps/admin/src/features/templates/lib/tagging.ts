import type { TemplateFieldType } from "@pratikar/types";

import type {
  CreateFromStoragePayload,
  StoredBlank,
  TaggableObject,
} from "../api/templatesApi";

import { validateFieldSchema, type FieldSchemaProblem } from "./fieldSchema";

/**
 * One blank in the document, as the operator edits it.
 *
 * `index` is the blank's position in the source file and is what the API tags
 * against — never the row's position on screen. Rows can be excluded, so the
 * two stop matching as soon as anyone unticks one, and tagging by the wrong
 * number would put a field in the wrong clause.
 */
export interface BlankRow {
  index: number;
  width: number;
  before: string;
  after: string;
  /** Unticked blanks stay as underscores: still printable, still fillable by hand. */
  include: boolean;
  key: string;
  label: string;
  type: TemplateFieldType;
  required: boolean;
}

/**
 * Everything is included by default, and every suggestion is pre-filled.
 *
 * A form has 11–19 blanks; starting from all-off would mean 19 ticks before
 * the screen does anything. The suggestions are a guess — but correcting a
 * wrong one is a keystroke, while typing all of them is the reason nobody
 * would use this twice.
 */
export function toRows(blanks: StoredBlank[]): BlankRow[] {
  return blanks.map((blank) => ({
    index: blank.index,
    width: blank.width,
    before: blank.before,
    after: blank.after,
    include: true,
    key: blank.suggestedField,
    label: blank.suggestedLabel,
    type: blank.suggestedType,
    required: true,
  }));
}

export function updateRow(
  rows: BlankRow[],
  index: number,
  patch: Partial<BlankRow>,
): BlankRow[] {
  return rows.map((row) => (row.index === index ? { ...row, ...patch } : row));
}

export const setAllIncluded = (
  rows: BlankRow[],
  include: boolean,
): BlankRow[] => rows.map((row) => ({ ...row, include }));

export const includedRows = (rows: BlankRow[]): BlankRow[] =>
  rows.filter((row) => row.include);

/**
 * Problems keyed by the row they belong to, so each message can sit next to
 * the blank that caused it rather than in a list at the top.
 *
 * Only included rows are checked. An excluded row keeps whatever half-typed
 * key it had, and complaining about a field that isn't being created would be
 * a dead end — there is nothing for the operator to do about it but tick the
 * box they just unticked.
 */
export interface RowProblems {
  /** Keyed by BlankRow.index. */
  byRow: Map<number, string[]>;
  /** Problems that belong to the form as a whole. */
  general: string[];
}

export function validateRows(rows: BlankRow[]): RowProblems {
  const byRow = new Map<number, string[]>();
  const general: string[] = [];

  const included = includedRows(rows);
  if (included.length === 0) {
    general.push(
      "Tick at least one blank. A template with no fields generates the form unchanged.",
    );
    return { byRow, general };
  }

  // The same rule the plain template editor uses, so a key that is legal in
  // one screen is legal in the other. Its indices are positions within the
  // included set, which is why they are mapped back through `included`.
  const problems: FieldSchemaProblem[] = validateFieldSchema(
    included.map((row) => ({
      key: row.key,
      label: row.label,
      type: row.type,
      required: row.required,
    })),
  );

  for (const problem of problems) {
    if (problem.index === null) {
      general.push(problem.message);
      continue;
    }
    const row = included[problem.index];
    if (!row) continue;
    byRow.set(row.index, [...(byRow.get(row.index) ?? []), problem.message]);
  }

  return { byRow, general };
}

export const hasProblems = (problems: RowProblems): boolean =>
  problems.general.length > 0 || problems.byRow.size > 0;

/** The `fields` half of the request — included rows, tagged by source index. */
export const toPayloadFields = (
  rows: BlankRow[],
): CreateFromStoragePayload["fields"] =>
  includedRows(rows).map((row) => ({
    index: row.index,
    key: row.key.trim(),
    label: row.label.trim(),
    type: row.type,
    required: row.required,
  }));

export interface FolderGroup {
  folder: string;
  objects: TaggableObject[];
}

/**
 * Files grouped the way they sit in the bucket. The folder is how these
 * documents are actually organised — all affidavits together — and it is the
 * only structure the bucket carries.
 */
export function groupByFolder(objects: TaggableObject[]): FolderGroup[] {
  const groups = new Map<string, TaggableObject[]>();
  for (const object of objects) {
    const folder = object.folder || "(no folder)";
    groups.set(folder, [...(groups.get(folder) ?? []), object]);
  }
  return [...groups.entries()]
    .map(([folder, items]) => ({ folder, objects: items }))
    .sort((a, b) => a.folder.localeCompare(b.folder));
}

/**
 * Matches on the file's name and its folder, case-insensitively.
 *
 * Searching the whole key rather than the title so that typing a folder name
 * narrows to that folder — with hundreds of files, that is the search people
 * actually run.
 */
export function matchesSearch(object: TaggableObject, query: string): boolean {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return true;
  return (
    object.key.toLowerCase().includes(trimmed) ||
    object.suggestedTitle.toLowerCase().includes(trimmed)
  );
}
