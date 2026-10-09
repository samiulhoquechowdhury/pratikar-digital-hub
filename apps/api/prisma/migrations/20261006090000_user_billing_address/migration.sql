-- A customer's billing address, for invoices and the GST place of supply.
ALTER TABLE "User" ADD COLUMN "addressLine" TEXT;
ALTER TABLE "User" ADD COLUMN "city" TEXT;
ALTER TABLE "User" ADD COLUMN "stateCode" TEXT;
ALTER TABLE "User" ADD COLUMN "pincode" TEXT;
