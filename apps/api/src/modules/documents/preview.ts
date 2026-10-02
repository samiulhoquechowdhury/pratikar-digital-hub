import { execFile } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** Pages rendered for the preview. Enough to check a long agreement. */
export const PREVIEW_MAX_PAGES = 12;

/** Screen resolution: readable on a phone, too coarse to pass for the file. */
const PREVIEW_DPI = 96;

/**
 * A PostScript EndPage hook that Ghostscript runs as it finishes each page:
 * it draws "PREVIEW · PRATIKAR" diagonally across the page, in rows, on top
 * of the content. Because it is drawn while the page is rasterised, the mark
 * is part of the pixels — there is no layer to remove and no text to copy.
 */
const WATERMARK = `
<< /EndPage {
  exch pop 0 eq {
    gsave
      currentpagedevice /PageSize get aload pop
      2 div exch 2 div exch translate
      40 rotate
      /Helvetica-Bold findfont 26 scalefont setfont
      0.8 0.83 0.88 setrgbcolor
      -5 1 5 {
        dup 175 mul
        exch 2 mod 0 eq { -360 } { -170 } ifelse
        exch moveto
        (PREVIEW  \\267  PRATIKAR     PREVIEW  \\267  PRATIKAR) show
      } for
    grestore
    true
  } { false } ifelse
} >> setpagedevice
`;

/**
 * The free preview of a generated document: its pages as watermarked images.
 *
 * Images rather than a watermarked PDF on purpose. A PDF with a mark on top
 * still carries the document's text, which copies straight out — the
 * preview would be the product, free. A picture of each page shows the
 * customer exactly what they will get and nothing they can lift.
 */
export async function renderPreviewPages(pdf: Buffer): Promise<Buffer[]> {
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "pratikar-preview-"));
  try {
    const input = path.join(workDir, "document.pdf");
    fs.writeFileSync(input, pdf);
    await execFileAsync("gs", [
      "-q",
      "-dSAFER",
      "-dBATCH",
      "-dNOPAUSE",
      "-sDEVICE=png16m",
      `-r${PREVIEW_DPI}`,
      "-dTextAlphaBits=4",
      "-dGraphicsAlphaBits=4",
      "-dFirstPage=1",
      `-dLastPage=${PREVIEW_MAX_PAGES}`,
      `-sOutputFile=${path.join(workDir, "page-%03d.png")}`,
      "-c",
      WATERMARK,
      "-f",
      input,
    ]);
    return fs
      .readdirSync(workDir)
      .filter((name) => /^page-\d{3}\.png$/.test(name))
      .sort()
      .map((name) => fs.readFileSync(path.join(workDir, name)));
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

/** Where page n (1-based) of a document's preview is stored. */
export const previewPageKey = (documentId: string, page: number) =>
  `documents/${documentId}/preview-${page}.png`;
