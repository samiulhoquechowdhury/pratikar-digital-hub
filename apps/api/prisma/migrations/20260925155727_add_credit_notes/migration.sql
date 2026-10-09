-- AlterEnum
ALTER TYPE "DocumentReviewStatus" ADD VALUE 'CANCELLED';

-- AlterEnum
ALTER TYPE "GeneratedDocumentStatus" ADD VALUE 'REFUNDED';

-- CreateTable
CREATE TABLE "CreditNote" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "noteNumber" TEXT NOT NULL,
    "financialYear" TEXT NOT NULL,
    "taxableAmount" INTEGER NOT NULL,
    "cgstAmount" INTEGER NOT NULL,
    "sgstAmount" INTEGER NOT NULL,
    "igstAmount" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "taxRatePercent" INTEGER NOT NULL,
    "placeOfSupply" TEXT NOT NULL,
    "reason" TEXT,
    "pdfKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentCounter" (
    "series" TEXT NOT NULL,
    "financialYear" TEXT NOT NULL,
    "lastSequence" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentCounter_pkey" PRIMARY KEY ("series","financialYear")
);

-- Carry the invoice sequence across before the old table goes.
--
-- Dropping it outright would restart invoice numbering at 1 and mint serials
-- that already exist on documents sent to customers. This database has no
-- invoices yet, but the migration has to be correct on one that does.
INSERT INTO "DocumentCounter" ("series", "financialYear", "lastSequence", "updatedAt")
SELECT 'INV', "financialYear", "lastSequence", "updatedAt" FROM "InvoiceCounter";

-- DropTable
DROP TABLE "InvoiceCounter";

-- CreateIndex
CREATE UNIQUE INDEX "CreditNote_orderId_key" ON "CreditNote"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditNote_invoiceId_key" ON "CreditNote"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditNote_noteNumber_key" ON "CreditNote"("noteNumber");

-- AddForeignKey
ALTER TABLE "CreditNote" ADD CONSTRAINT "CreditNote_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditNote" ADD CONSTRAINT "CreditNote_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

