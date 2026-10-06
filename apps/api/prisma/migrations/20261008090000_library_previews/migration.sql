-- The free excerpt of each library item: watermarked page images.
ALTER TABLE "ContentLibraryItem" ADD COLUMN "previewPageCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ContentLibraryItem" ADD COLUMN "previewOfFile" TEXT;
