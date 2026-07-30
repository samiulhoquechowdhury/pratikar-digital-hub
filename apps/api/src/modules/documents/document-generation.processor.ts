import { execFile } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { promisify } from "node:util";

import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import type { Job } from "bullmq";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";

import { PrismaService } from "../../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";

const execFileAsync = promisify(execFile);

export interface DocumentGenerationJobData {
  generatedDocumentId: string;
}

// docs/trd.md Section 4.2: docxtemplater fills the template -> LibreOffice
// headless converts to PDF for preview -> both DOCX and PDF stored in R2.
// Runs as a BullMQ worker (docs/architecture.md Section 5), not inline in the
// request, because the LibreOffice conversion step is slow (seconds, not ms).
@Processor("document-generation")
export class DocumentGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(DocumentGenerationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {
    super();
  }

  async process(job: Job<DocumentGenerationJobData>): Promise<void> {
    const { generatedDocumentId } = job.data;

    const doc = await this.prisma.generatedDocument.findUnique({
      where: { id: generatedDocumentId },
      include: { template: true },
    });
    if (!doc)
      throw new Error(`GeneratedDocument ${generatedDocumentId} not found`);
    if (!doc.template.templateFileKey) {
      throw new Error(
        `Template ${doc.templateId} has no templateFileKey — nothing to fill`,
      );
    }

    const sourceDocx = await this.storage.read(doc.template.templateFileKey);
    const filledDocx = this.fillTemplate(
      sourceDocx,
      doc.filledData as Record<string, unknown>,
    );

    const docxKey = `documents/${doc.id}.docx`;
    await this.storage.upload(
      docxKey,
      filledDocx,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );

    const pdfBuffer = await this.convertToPdf(filledDocx, doc.id);
    const pdfKey = `documents/${doc.id}.pdf`;
    await this.storage.upload(pdfKey, pdfBuffer, "application/pdf");

    await this.prisma.generatedDocument.update({
      where: { id: doc.id },
      data: {
        fileUrl: this.storage.getUrl(docxKey),
        previewFileUrl: this.storage.getUrl(pdfKey),
      },
    });

    this.logger.log(`Generated document ${doc.id}: docx + pdf uploaded`);
  }

  private fillTemplate(
    source: Buffer,
    filledData: Record<string, unknown>,
  ): Buffer {
    const zip = new PizZip(source);
    const template = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      // Optional fields (e.g. noticePeriodInDays) may be absent from
      // filledData — render blank instead of throwing on an undefined tag.
      nullGetter: () => "",
    });
    template.render(filledData);
    return template.getZip().generate({ type: "nodebuffer" });
  }

  private async convertToPdf(
    docxBuffer: Buffer,
    generatedDocumentId: string,
  ): Promise<Buffer> {
    const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "pratikar-docgen-"));
    const docxPath = path.join(workDir, `${generatedDocumentId}.docx`);
    const pdfPath = path.join(workDir, `${generatedDocumentId}.pdf`);

    try {
      fs.writeFileSync(docxPath, docxBuffer);
      await execFileAsync("soffice", [
        "--headless",
        "--convert-to",
        "pdf",
        "--outdir",
        workDir,
        docxPath,
      ]);
      return fs.readFileSync(pdfPath);
    } finally {
      fs.rmSync(workDir, { recursive: true, force: true });
    }
  }
}
