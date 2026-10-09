-- AlterTable
ALTER TABLE "OtpRequest" ADD COLUMN     "ip" TEXT;

-- CreateIndex
CREATE INDEX "OtpRequest_identifier_createdAt_idx" ON "OtpRequest"("identifier", "createdAt");

-- CreateIndex
CREATE INDEX "OtpRequest_ip_createdAt_idx" ON "OtpRequest"("ip", "createdAt");

