-- The column held the clean PDF, not a preview — name it for what it is.
ALTER TABLE "GeneratedDocument" RENAME COLUMN "previewFileUrl" TO "pdfFileUrl";

-- Watermarked preview pages, rendered by the generation worker.
ALTER TABLE "GeneratedDocument" ADD COLUMN "previewPageCount" INTEGER NOT NULL DEFAULT 0;
