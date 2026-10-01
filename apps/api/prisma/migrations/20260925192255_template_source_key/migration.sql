-- AlterTable
ALTER TABLE "Template" ADD COLUMN     "sourceKey" TEXT;

-- CreateIndex
CREATE INDEX "Template_sourceKey_idx" ON "Template"("sourceKey");
