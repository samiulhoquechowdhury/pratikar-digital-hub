-- When a customer erased their account. Personal fields are cleared at the
-- same moment; the row stays for the orders and invoices that reference it.
ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);
