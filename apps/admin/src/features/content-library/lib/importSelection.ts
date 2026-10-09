import type { StorageObject } from "../api/contentLibraryApi";

/**
 * Selection and pricing maths for the storage import screen.
 *
 * Pure and separate from the component because this is where an operator
 * cataloguing 449 files can quietly get a wrong result — a folder that reports
 * "all selected" while skipping the ones already imported, a price applied to
 * rows that were never chosen. Easier to pin down as functions than to click
 * through 449 checkboxes to check.
 */

export interface FolderGroup {
  folder: string;
  objects: StorageObject[];
  /** Already in the catalogue — shown, but never selectable. */
  cataloguedCount: number;
  importableCount: number;
}

export function groupByFolder(objects: StorageObject[]): FolderGroup[] {
  const groups = new Map<string, StorageObject[]>();
  for (const object of objects) {
    const list = groups.get(object.folder) ?? [];
    list.push(object);
    groups.set(object.folder, list);
  }
  return [...groups.entries()]
    .map(([folder, list]) => ({
      folder,
      objects: list,
      cataloguedCount: list.filter((o) => o.catalogued).length,
      importableCount: list.filter((o) => !o.catalogued).length,
    }))
    .sort((a, b) => b.importableCount - a.importableCount);
}

/**
 * Toggling a folder only ever touches what can actually be imported.
 *
 * Without this an operator selects "all 180 agreements", imports, and is told
 * 3 were skipped — with no way to see which, because the already-catalogued
 * ones looked selected too.
 */
export function toggleFolder(
  selected: Set<string>,
  group: FolderGroup,
  on: boolean,
): Set<string> {
  const next = new Set(selected);
  for (const object of group.objects) {
    if (object.catalogued) continue;
    if (on) next.add(object.key);
    else next.delete(object.key);
  }
  return next;
}

export type FolderState = "none" | "some" | "all";

export function folderState(
  selected: Set<string>,
  group: FolderGroup,
): FolderState {
  if (group.importableCount === 0) return "none";
  const chosen = group.objects.filter(
    (o) => !o.catalogued && selected.has(o.key),
  ).length;
  if (chosen === 0) return "none";
  return chosen === group.importableCount ? "all" : "some";
}

/**
 * Rupees to paise.
 *
 * Money is stored as integer paise everywhere in this system, and "199.99"
 * typed into a price box must not become 19998.999999999996. Rounding here
 * rather than trusting the multiplication is the whole point.
 */
export function rupeesToPaise(input: string): number | null {
  const trimmed = input.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  return Math.round(Number(trimmed) * 100);
}
