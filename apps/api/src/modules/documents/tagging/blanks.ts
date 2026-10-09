import PizZip from "pizzip";

/**
 * Turning a fill-in-the-blank form into a template the generator can fill.
 *
 * The catalogue is 444 Word documents written to be printed and completed by
 * hand: "I, Mr./Ms. _________, Son/Daughter/Wife of _________". docxtemplater
 * fills *named* tags, so none of them can drive the generator as they stand.
 * This finds the blanks and rewrites them as {tags}.
 *
 * ── WHY THIS IS NOT A STRING REPLACE ──────────────────────────────────────
 * A .docx is XML, and Word splits a single visible sentence across many
 * <w:t> runs whenever formatting changes — sometimes mid-blank. Measured
 * across a 30-document sample of the real catalogue: 453 blanks, 96.7%
 * contained in one run, 3.3% straddling two or more. Replacing inside each
 * run independently silently skips that 3.3%, and they are disproportionately
 * the long free-text areas. So the runs are stitched into one string, the
 * blanks are located there, and the edits are mapped back onto the runs they
 * actually cover.
 */

/** Three or more underscores. Two is usually "__" inside a word or a rule. */
const BLANK = /_{3,}/g;

export interface Blank {
  /** Position in the document, 0-based, in reading order. */
  index: number;
  /** How many underscores — a hint at whether it wants a word or a paragraph. */
  width: number;
  /** Text immediately before, to work out what the blank is for. */
  before: string;
  /** Text immediately after. */
  after: string;
}

interface Run {
  /** Offset of the run's text within the whole document. */
  start: number;
  end: number;
  /** Where the text sits inside the raw XML, so it can be spliced back. */
  xmlStart: number;
  xmlEnd: number;
  text: string;
}

const RUN = /<w:t[^>]*>([^<]*)<\/w:t>/g;

function readRuns(xml: string): { runs: Run[]; text: string } {
  const runs: Run[] = [];
  let cursor = 0;
  for (const m of xml.matchAll(RUN)) {
    const text = m[1]!;
    const openEnd = m.index + m[0].indexOf(">") + 1;
    runs.push({
      start: cursor,
      end: cursor + text.length,
      xmlStart: openEnd,
      xmlEnd: openEnd + text.length,
      text,
    });
    cursor += text.length;
  }
  return { runs, text: runs.map((r) => r.text).join("") };
}

const documentXml = (buffer: Buffer): { zip: PizZip; xml: string } => {
  const zip = new PizZip(buffer);
  const file = zip.file("word/document.xml");
  if (!file) throw new Error("Not a Word document — no word/document.xml");
  return { zip, xml: file.asText() };
};

/** Collapses runs of whitespace so context reads as a sentence, not layout. */
const tidy = (s: string) => s.replace(/\s+/g, " ").trim();

/**
 * Every blank in the document, with enough surrounding text to tell what it
 * is for. The context is the whole point: "_________" says nothing, but
 * "Son/Daughter/Wife of _________" says exactly what belongs there.
 */
export function extractBlanks(buffer: Buffer, contextChars = 60): Blank[] {
  const { xml } = documentXml(buffer);
  const { text } = readRuns(xml);

  const blanks: Blank[] = [];
  let index = 0;
  for (const m of text.matchAll(BLANK)) {
    const start = m.index;
    blanks.push({
      index: index++,
      width: m[0].length,
      before: tidy(text.slice(Math.max(0, start - contextChars), start)),
      after: tidy(
        text.slice(start + m[0].length, start + m[0].length + contextChars),
      ),
    });
  }
  return blanks;
}

export interface TagAssignment {
  /** Which blank, by the index extractBlanks gave it. */
  index: number;
  /** The field name, e.g. "landlordName". Becomes {landlordName}. */
  field: string;
}

/**
 * Rewrites the chosen blanks as docxtemplater tags.
 *
 * Edits are applied back-to-front so earlier offsets stay valid as the string
 * changes length. A blank spanning several runs has the tag written into the
 * first and the remainder emptied — putting the tag in each run would produce
 * the same field repeated across the line.
 *
 * Blanks with no assignment are left exactly as they are. A form part-way
 * through conversion should still print and still be fillable by hand.
 */
export function applyTags(
  buffer: Buffer,
  assignments: TagAssignment[],
): Buffer {
  const { zip, xml } = documentXml(buffer);
  const { runs, text } = readRuns(xml);

  const byIndex = new Map(assignments.map((a) => [a.index, a.field]));
  const matches = [...text.matchAll(BLANK)];

  // XML-level edits, collected then applied in reverse.
  const edits: { from: number; to: number; replace: string }[] = [];

  matches.forEach((m, index) => {
    const field = byIndex.get(index);
    if (!field) return;

    const start = m.index;
    const end = start + m[0].length;
    const covered = runs.filter((r) => r.end > start && r.start < end);
    if (covered.length === 0) return;

    covered.forEach((run, position) => {
      // The slice of this run that the blank actually occupies.
      const from = run.xmlStart + Math.max(0, start - run.start);
      const to = run.xmlStart + Math.min(run.text.length, end - run.start);
      edits.push({ from, to, replace: position === 0 ? `{${field}}` : "" });
    });
  });

  let out = xml;
  for (const edit of edits.sort((a, b) => b.from - a.from)) {
    out = out.slice(0, edit.from) + edit.replace + out.slice(edit.to);
  }

  zip.file("word/document.xml", out);
  return zip.generate({ type: "nodebuffer" });
}

/**
 * A field name from the words around a blank, as a starting suggestion.
 *
 * Only ever a suggestion — an operator confirms every one, because a
 * mis-tagged field puts the wrong person's name in a legal document and
 * nothing downstream would catch it.
 */
export function suggestFieldName(blank: Blank): string {
  const words = tidy(blank.before)
    .replace(/[^A-Za-z ]/g, " ")
    .split(" ")
    .filter(Boolean)
    .slice(-3);
  if (words.length === 0) return `field${blank.index + 1}`;

  const [first, ...rest] = words.map((w) => w.toLowerCase());
  return (
    first! + rest.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("")
  ).slice(0, 40);
}
