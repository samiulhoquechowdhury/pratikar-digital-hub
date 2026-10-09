import PizZip from "pizzip";

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
};

const decode = (text: string) =>
  text.replace(/&(amp|lt|gt|quot|apos);/g, (entity) => ENTITIES[entity]!);

/**
 * The readable text of a Word document, one line per paragraph.
 *
 * Read straight from word/document.xml rather than through a converter: the
 * text is all that's wanted, and a paragraph is a <w:p> whose words sit in
 * <w:t> runs, with <w:tab/> and <w:br/> for tabs and line breaks. Formatting,
 * tables' borders and images are dropped; table cells come out as their own
 * lines, which reads well enough for a model to follow the document's shape.
 */
export function docxToText(buffer: Buffer): string {
  const file = new PizZip(buffer).file("word/document.xml");
  if (!file) throw new Error("Not a Word document — no word/document.xml");
  const xml = file.asText();

  const paragraphs = xml.split(/<\/w:p>/).map((paragraph) => {
    let line = "";
    for (const token of paragraph.matchAll(
      /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:tab\/>|<w:br\/>/g,
    )) {
      if (token[1] !== undefined) line += decode(token[1]);
      else if (token[0] === "<w:tab/>") line += "\t";
      else line += "\n";
    }
    return line.replace(/[ \t]+$/g, "");
  });

  return paragraphs
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
