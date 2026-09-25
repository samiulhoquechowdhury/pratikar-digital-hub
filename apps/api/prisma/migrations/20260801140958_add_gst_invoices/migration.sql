/*
  Warnings:

  - You are about to drop the column `pdfUrl` on the `Invoice` table. All the data in the column will be lost.
  - Added the required column `cgstAmount` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `financialYear` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `igstAmount` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `placeOfSupply` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sgstAmount` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `taxRatePercent` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `taxableAmount` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAmount` to the `Invoice` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "pdfUrl",
ADD COLUMN     "cgstAmount" INTEGER NOT NULL,
ADD COLUMN     "financialYear" TEXT NOT NULL,
ADD COLUMN     "igstAmount" INTEGER NOT NULL,
ADD COLUMN     "pdfKey" TEXT,
ADD COLUMN     "placeOfSupply" TEXT NOT NULL,
ADD COLUMN     "sgstAmount" INTEGER NOT NULL,
ADD COLUMN     "taxRatePercent" INTEGER NOT NULL,
ADD COLUMN     "taxableAmount" INTEGER NOT NULL,
ADD COLUMN     "totalAmount" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "InvoiceCounter" (
    "financialYear" TEXT NOT NULL,
    "lastSequence" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceCounter_pkey" PRIMARY KEY ("financialYear")
);
