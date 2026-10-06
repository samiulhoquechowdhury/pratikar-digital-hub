-- When the "access ends soon" email was sent, so it goes out once.
ALTER TABLE "Enrollment" ADD COLUMN "expiryReminderSentAt" TIMESTAMP(3);
