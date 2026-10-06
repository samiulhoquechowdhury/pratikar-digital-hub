import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import type { Job } from "bullmq";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";

import { reportFinalJobFailure } from "../../common/monitoring/job-failures";
import { convertToPdf } from "../../common/office/convert-to-pdf";
import {
  previewPageKey,
  renderPreviewPages,
} from "../../common/office/preview";
import { PrismaService } from "../../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";

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

    const pdfBuffer = await convertToPdf(filledDocx, ".docx");
    const pdfKey = `documents/${doc.id}.pdf`;
    await this.storage.upload(pdfKey, pdfBuffer, "application/pdf");

    // Storage keys, not URLs. A download URL is signed and expires, so one
    // persisted here would be dead by the time the customer paid — and a URL
    // long-lived enough to survive being stored would be an unrevocable
    // public link to a paid document. The URL is minted at download time.
    // The free preview: each page as a watermarked image. Rendered from the
    // PDF, so the customer previews exactly the layout they'll download.
    const pages = await renderPreviewPages(pdfBuffer);
    for (const [index, page] of pages.entries()) {
      await this.storage.upload(
        previewPageKey(doc.id, index + 1),
        page,
        "image/png",
      );
    }

    await this.prisma.generatedDocument.update({
      where: { id: doc.id },
      data: {
        fileUrl: docxKey,
        pdfFileUrl: pdfKey,
        previewPageCount: pages.length,
      },
    });

    this.logger.log(
      `Generated document ${doc.id}: docx, pdf and ${pages.length} preview pages uploaded`,
    );
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

  /** Reports the job to monitoring once its last retry has failed. */
  @OnWorkerEvent("failed")
  onFailed(job: Job | undefined, error: Error) {
    reportFinalJobFailure(job, error);
  }
}
