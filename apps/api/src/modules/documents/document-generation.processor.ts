import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { Job } from "bullmq";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";

import { reportFinalJobFailure } from "../../common/monitoring/job-failures";
import { convertToPdf } from "../../common/office/convert-to-pdf";
import { draftToDocx } from "../../common/office/draft-docx";
import {
  previewPageKey,
  renderPreviewPages,
} from "../../common/office/preview";
import { PrismaService } from "../../prisma/prisma.service";
import type { DocumentDraft, DraftBrief } from "../ai/drafting/draft-prompt";
import {
  DraftingError,
  DraftingService,
} from "../ai/drafting/drafting.service";
import { PrecedentFinder } from "../ai/drafting/precedents.service";
import { StorageService } from "../storage/storage.service";

export interface DocumentGenerationJobData {
  generatedDocumentId: string;
  /** CUSTOM only: the change the customer asked for, when this is a revision. */
  instruction?: string;
}

const DOCX_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** What the customer reads when drafting fails for a reason that isn't theirs. */
const DRAFT_FAILED =
  "We couldn't draft this right now. Please try again in a few minutes.";
const REVISION_FAILED =
  "We couldn't make that change right now. Your previous draft is unchanged — please try again in a few minutes.";

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
    private readonly drafting: DraftingService,
    private readonly precedents: PrecedentFinder,
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

    if (doc.kind === "CUSTOM") {
      await this.draftCustom(job, doc);
      return;
    }

    if (!doc.template?.templateFileKey) {
      throw new Error(
        `Template ${doc.templateId} has no templateFileKey — nothing to fill`,
      );
    }

    const sourceDocx = await this.storage.read(doc.template.templateFileKey);
    const filledDocx = this.fillTemplate(
      sourceDocx,
      doc.filledData as Record<string, unknown>,
    );
    await this.publish(doc.id, filledDocx);
  }

  /**
   * A custom document: the model drafts it (or revises the last draft), and
   * the draft is laid out as Word and published like any other document.
   *
   * Failures the customer should hear about are written to draftError
   * rather than thrown, so the page can say so instead of waiting forever.
   * A temporary one is thrown, for the queue to retry, until the last
   * attempt — then it's written too.
   */
  private async draftCustom(
    job: Job<DocumentGenerationJobData>,
    doc: { id: string; brief: unknown; draft: unknown },
  ): Promise<void> {
    const brief = doc.brief as DraftBrief;
    const previous = doc.draft as DocumentDraft | null;
    const instruction = job.data.instruction;
    const revising = Boolean(instruction && previous);

    // The advocate-drafted forms to model it on: found for a first draft,
    // and the same ones again for a revision of it.
    const precedents = revising
      ? await this.precedents.load(previous!.references ?? [])
      : await this.precedents.find(brief);

    let draft: DocumentDraft;
    try {
      draft = await this.drafting.draft(
        brief,
        revising
          ? { previous: previous!, instruction: instruction! }
          : undefined,
        precedents,
      );
    } catch (error) {
      const lastAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
      if (
        error instanceof DraftingError &&
        error.reason === "busy" &&
        !lastAttempt
      ) {
        throw error;
      }
      this.logger.error(
        `Drafting ${doc.id} failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      await this.failDraft(doc.id, revising ? previous : null);
      return;
    }

    if (draft.declined) {
      // Nothing to publish. A declined revision leaves the last draft as it
      // was, re-published so the customer still has it.
      await this.failDraft(doc.id, revising ? previous : null, draft.declined);
      return;
    }

    // Recorded with the draft: what a revision reloads, and what the
    // customer and the reviewing advocate are shown it was based on.
    const references = precedents.map(({ id, title, fileUrl }) => ({
      id,
      title,
      fileUrl,
    }));
    await this.publish(doc.id, await draftToDocx(draft), {
      draft: { ...draft, references } as object,
      title: draft.title,
      draftError: null,
    });
  }

  /** Records why a draft failed, restoring the previous draft's files if there was one. */
  private async failDraft(
    documentId: string,
    previous: DocumentDraft | null,
    reason?: string,
  ): Promise<void> {
    const draftError = reason ?? (previous ? REVISION_FAILED : DRAFT_FAILED);
    if (previous) {
      await this.publish(documentId, await draftToDocx(previous), {
        draftError,
      });
    } else {
      await this.prisma.generatedDocument.update({
        where: { id: documentId },
        data: { draftError },
      });
    }
  }

  /**
   * Stores the Word file, its PDF and the watermarked preview pages, then
   * points the document at them — the last step, so the preview never
   * reports ready before every file exists.
   */
  private async publish(
    documentId: string,
    docx: Buffer,
    extra: Prisma.GeneratedDocumentUpdateInput = {},
  ): Promise<void> {
    const docxKey = `documents/${documentId}.docx`;
    await this.storage.upload(docxKey, docx, DOCX_TYPE);

    const pdfBuffer = await convertToPdf(docx, ".docx");
    const doc = { id: documentId };
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
        ...extra,
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
