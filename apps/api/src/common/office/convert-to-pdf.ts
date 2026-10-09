import { execFile } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/**
 * Converts an office file — Word, PowerPoint, Excel — to PDF with
 * LibreOffice. A PDF comes back as it went in.
 *
 * Staged in a private temp directory, removed afterwards: the file may be a
 * customer's filled document. `extension` matters because LibreOffice picks
 * its import filter from it.
 */
export async function convertToPdf(
  file: Buffer,
  extension: string,
): Promise<Buffer> {
  const ext = extension.toLowerCase().replace(/^\.?/, ".");
  if (ext === ".pdf") return file;

  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "pratikar-office-"));
  const input = path.join(workDir, `input${ext}`);
  try {
    fs.writeFileSync(input, file);
    await execFileAsync("soffice", [
      "--headless",
      "--convert-to",
      "pdf",
      "--outdir",
      workDir,
      input,
    ]);
    return fs.readFileSync(path.join(workDir, "input.pdf"));
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

/** A storage key's extension, e.g. "forms/Rent Deed.docx" → ".docx". */
export const extensionOf = (key: string): string => {
  const dot = key.lastIndexOf(".");
  return dot === -1 ? "" : key.slice(dot).toLowerCase();
};
