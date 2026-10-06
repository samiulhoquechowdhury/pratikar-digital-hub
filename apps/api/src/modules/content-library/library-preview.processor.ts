import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import type { Job } from "bullmq";

import { reportFinalJobFailure } from "../../common/monitoring/job-failures";
import { convertToPdf, extensionOf } from "../../common/office/convert-to-pdf";
import {
  libraryPreviewKey,
  renderPreviewPages,
} from "../../common/office/preview";
import { PrismaService } from "../../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";

export const LIBRARY_PREVIEW_QUEUE = "library-preview";

/**
 * Pages in the free excerpt. Two: enough to judge the quality and see what
 * a form asks for, not so much that the excerpt is the product.
 */
export const LIBRARY_PREVIEW_PAGES = 2;

export interface LibraryPreviewJob {
  itemId: string;
}

export type LibraryPreviewOutcome =
  "rendered" | "current" | "unrenderable" | "missing";

/**
 * Renders a library item's free excerpt: its file converted to PDF, the
 * first pages drawn as watermarked images (docs/srs.md 3.4 — "preview is
 * free; full download is pay-per-item").
 *
 * One at a time: LibreOffice is heavy, and a backfill of hundreds of items
 * should queue up behind itself rather than run all at once.
 */
@Processor(LIBRARY_PREVIEW_QUEUE)
export class LibraryPreviewProcessor extends WorkerHost {
  private readonly logger = new Logger(LibraryPreviewProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {
    super();
  }

  async process(job: Job<LibraryPreviewJob>): Promise<LibraryPreviewOutcome> {
    const item = await this.prisma.contentLibraryItem.findUnique({
      where: { id: job.data.itemId },
      select: {
        id: true,
        fileUrl: true,
        previewOfFile: true,
        previewPageCount: true,
      },
    });
    if (!item) return "missing";
    // Already made from this very file: nothing to do.
    if (item.previewOfFile === item.fileUrl) return "current";

    // A storage failure is worth retrying; let it throw.
    const file = await this.storage.read(item.fileUrl);

    let pages: Buffer[];
    try {
      const pdf = await convertToPdf(file, extensionOf(item.fileUrl));
      pages = await renderPreviewPages(pdf, LIBRARY_PREVIEW_PAGES);
    } catch (error) {
      // The same file will fail the same way every time. Record "no
      // preview" for it, so the page says so instead of waiting forever and
      // the next visitor doesn't queue another attempt.
      this.logger.warn(
        `No preview for library item ${item.id} (${item.fileUrl}): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      await this.record(item.id, item.fileUrl, 0);
      return "unrenderable";
    }

    for (const [index, page] of pages.entries()) {
      await this.storage.upload(
        libraryPreviewKey(item.id, index + 1),
        page,
        "image/png",
      );
    }
    await this.record(item.id, item.fileUrl, pages.length);
    this.logger.log(`Rendered a ${pages.length}-page preview of ${item.id}`);
    return "rendered";
  }

  private record(id: string, fileUrl: string, pageCount: number) {
    return this.prisma.contentLibraryItem.update({
      where: { id },
      data: { previewOfFile: fileUrl, previewPageCount: pageCount },
    });
  }

  /** Reports the job to monitoring once its last retry has failed. */
  @OnWorkerEvent("failed")
  onFailed(job: Job | undefined, error: Error) {
    reportFinalJobFailure(job, error);
  }
}
