import {
  AlignmentType,
  Document,
  Packer,
  Paragraph,
  Tab,
  TextRun,
  type IParagraphOptions,
} from "docx";

import type { DocumentDraft } from "../../modules/ai/drafting/draft-prompt";

/** Times New Roman 12pt on A4 with 1-inch margins: how Indian legal documents are typed. */
const FONT = "Times New Roman";
const SIZE = 24; // half-points
const INCH = 1440; // twips
const A4 = { width: 11906, height: 16838 }; // twips

const run = (text: string, bold = false) =>
  new TextRun({ text, bold, font: FONT, size: SIZE });

/** One paragraph with a line per "\n" in the text. */
function lines(text: string, options: IParagraphOptions = {}, bold = false) {
  const parts = text.split("\n");
  return new Paragraph({
    ...options,
    children: parts.map(
      (part, index) =>
        new TextRun({
          text: part,
          bold,
          font: FONT,
          size: SIZE,
          break: index > 0 ? 1 : undefined,
        }),
    ),
  });
}

/**
 * Lays a draft out as a Word document. Clauses are numbered here, in order,
 * so a revision that adds or removes one never leaves the numbering wrong.
 */
export async function draftToDocx(draft: DocumentDraft): Promise<Buffer> {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 360 },
      children: [
        new TextRun({
          text: draft.title.toUpperCase(),
          bold: true,
          font: FONT,
          size: 28,
        }),
      ],
    }),
  ];

  let clause = 0;
  for (const block of draft.blocks) {
    const text = block.text.trim();
    switch (block.kind) {
      case "heading":
        paragraphs.push(
          lines(
            text.toUpperCase(),
            { spacing: { before: 240, after: 120 }, keepNext: true },
            true,
          ),
        );
        break;
      case "clause":
        clause += 1;
        paragraphs.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 160, line: 300 },
            indent: { left: 440, hanging: 440 },
            // A real tab element: Word ignores a tab character in text.
            children: [
              run(`${clause}.`),
              new TextRun({ children: [new Tab()], font: FONT, size: SIZE }),
              run(text),
            ],
          }),
        );
        break;
      case "signature":
        paragraphs.push(
          lines(text, {
            spacing: { before: 480, after: 240 },
            keepLines: true,
          }),
        );
        break;
      default: {
        // One Word paragraph per line. A justified paragraph with line
        // breaks inside it stretches every line before a break to the full
        // width ("the            Licensor"); separate paragraphs don't.
        const parts = text.split("\n").filter((part) => part.trim());
        parts.forEach((part, index) =>
          paragraphs.push(
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              spacing: {
                after: index === parts.length - 1 ? 160 : 60,
                line: 300,
              },
              children: [run(part.trim())],
            }),
          ),
        );
      }
    }
  }

  const doc = new Document({
    creator: "Pratikar Digital Hub",
    title: draft.title,
    sections: [
      {
        properties: {
          page: {
            size: A4,
            margin: { top: INCH, bottom: INCH, left: INCH, right: INCH },
          },
        },
        children: paragraphs,
      },
    ],
  });
  return Packer.toBuffer(doc);
}
