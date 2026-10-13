/**
 * Spelling-tolerant matching for catalogue search.
 *
 * People search for legal documents the way they say them — "afidavit",
 * "agrement", "partnersip deed", "pawer of atorney" — and a search that
 * answers "no matches" to a misspelling reads as "we don't have it". These
 * rules let a word match when it is a few keystrokes away from a word in the
 * title, while keeping short words exact so "will" doesn't start finding
 * "bill".
 *
 * Pure functions, no React, so the tolerances are tested directly.
 */

/** Lower-case words, punctuation dropped: "Sale-Deed (2026)" → sale, deed, 2026. */
export const wordsOf = (text: string): string[] =>
  text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

/**
 * Edits allowed for a query word of this length. Short words stay exact —
 * at three letters one typo is a different word — and long ones get two.
 */
export function allowedEdits(length: number): number {
  if (length < 4) return 0;
  if (length < 7) return 1;
  return 2;
}

/**
 * Optimal-string-alignment distance: insertions, deletions, substitutions,
 * and swapping two neighbouring letters ("agreemnet") each count as one.
 * Stops early once the distance is past `limit`, since only "close or not"
 * matters here.
 */
export function editDistance(a: string, b: string, limit = Infinity): number {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  let prevPrev: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(prev[j]! + 1, row[j - 1]! + 1, prev[j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, prevPrev[j - 2]! + 1);
      }
      row.push(value);
      best = Math.min(best, value);
    }
    if (best > limit) return limit + 1;
    prevPrev = prev;
    prev = row;
  }
  return prev[b.length]!;
}

/**
 * How close a typed word is to a word of the title: 0 when the title word
 * starts with it (the exact rule), the number of edits when it's a near
 * miss, or null when it's too far. A near miss counts against the whole
 * word and against the start of it, so a misspelt beginning still finds a
 * longer word: "agrem" → "agreement".
 */
export function wordCloseness(wanted: string, have: string): number | null {
  if (have.startsWith(wanted)) return 0;
  const limit = allowedEdits(wanted.length);
  if (limit === 0) return null;
  let best = editDistance(wanted, have, limit);
  for (const length of [wanted.length - 1, wanted.length, wanted.length + 1]) {
    if (length < 1 || length >= have.length) continue;
    best = Math.min(best, editDistance(wanted, have.slice(0, length), limit));
  }
  return best <= limit ? best : null;
}

/**
 * How far the text is from the query: the edits needed, summed over the
 * query's words, or null when some word has no close match. Words in
 * `exactWords` must match exactly — they're spelt right, so loosening them
 * only adds noise ("rent" finding "Retainer").
 */
export function fuzzyScore(
  text: string,
  query: string,
  exactWords: ReadonlySet<string> = new Set(),
): number | null {
  const wanted = wordsOf(query);
  const have = wordsOf(text);
  let total = 0;
  for (const word of wanted) {
    let best: number | null = null;
    for (const w of have) {
      const closeness = exactWords.has(word)
        ? w.startsWith(word)
          ? 0
          : null
        : wordCloseness(word, w);
      if (closeness !== null && (best === null || closeness < best)) {
        best = closeness;
      }
      if (best === 0) break;
    }
    if (best === null) return null;
    total += best;
  }
  return total;
}

/** Every query word close to some word of the text — a fuzzy match. */
export function matchesWordsFuzzy(text: string, query: string): boolean {
  return fuzzyScore(text, query) !== null;
}

/**
 * The query, re-spelt with the words the catalogue actually uses: "rent
 * agrement" → "rent agreement". Each word that doesn't already start a
 * catalogue word is swapped for the closest one; ties go to the word that
 * appears most often. Null when nothing needed changing or nothing was
 * close enough to say "did you mean".
 */
export function correctQuery(query: string, texts: string[]): string | null {
  const wanted = wordsOf(query);
  if (wanted.length === 0) return null;

  const frequency = new Map<string, number>();
  for (const text of texts) {
    for (const word of new Set(wordsOf(text))) {
      frequency.set(word, (frequency.get(word) ?? 0) + 1);
    }
  }
  const vocabulary = [...frequency.keys()];

  let changed = false;
  const corrected = wanted.map((word) => {
    if (vocabulary.some((w) => w.startsWith(word))) return word;
    let best: { word: string; edits: number; count: number } | null = null;
    for (const candidate of vocabulary) {
      // Compared whole-word here: the suggestion should be a real word, not
      // the start of one.
      const edits = editDistance(word, candidate, allowedEdits(word.length));
      if (edits > allowedEdits(word.length)) continue;
      const count = frequency.get(candidate)!;
      if (
        !best ||
        edits < best.edits ||
        (edits === best.edits && count > best.count)
      ) {
        best = { word: candidate, edits, count };
      }
    }
    if (!best) return word;
    changed = true;
    return best.word;
  });

  return changed ? corrected.join(" ") : null;
}

/**
 * Search with a typo safety net: exact matches when there are any — so a
 * correctly spelt search never gets noisier — and otherwise the near misses,
 * closest first, flagged so the page can say it corrected the spelling.
 *
 * Only the words the catalogue doesn't know are loosened: in "rent
 * agrement", "rent" is a real catalogue word and stays exact, and only
 * "agrement" is allowed to be a near miss.
 */
export function searchWithTypos<T>(
  items: T[],
  query: string,
  textOf: (item: T) => string,
  matchesExact: (text: string, query: string) => boolean,
): { items: T[]; fuzzy: boolean; correction: string | null } {
  const exact = items.filter((item) => matchesExact(textOf(item), query));
  const wanted = wordsOf(query);
  if (exact.length > 0 || wanted.length === 0) {
    return { items: exact, fuzzy: false, correction: null };
  }

  const vocabulary = new Set(items.flatMap((item) => wordsOf(textOf(item))));
  const known = new Set(
    wanted.filter((word) =>
      [...vocabulary].some((have) => have.startsWith(word)),
    ),
  );

  const near = items
    .map((item) => ({ item, score: fuzzyScore(textOf(item), query, known) }))
    .filter(
      (entry): entry is { item: T; score: number } => entry.score !== null,
    )
    .sort((a, b) => a.score - b.score)
    .map((entry) => entry.item);

  return {
    items: near,
    fuzzy: near.length > 0,
    correction: near.length > 0 ? correctQuery(query, near.map(textOf)) : null,
  };
}
