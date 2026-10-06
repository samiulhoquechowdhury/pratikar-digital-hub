-- Custom AI drafts: a generated document with no template behind it.
CREATE TYPE "DocumentKind" AS ENUM ('TEMPLATE', 'CUSTOM');

ALTER TABLE "GeneratedDocument" ADD COLUMN "kind" "DocumentKind" NOT NULL DEFAULT 'TEMPLATE';
ALTER TABLE "GeneratedDocument" ALTER COLUMN "templateId" DROP NOT NULL;
ALTER TABLE "GeneratedDocument" DROP CONSTRAINT "GeneratedDocument_templateId_fkey";
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GeneratedDocument" ADD COLUMN "title" TEXT;
ALTER TABLE "GeneratedDocument" ADD COLUMN "brief" JSONB;
ALTER TABLE "GeneratedDocument" ADD COLUMN "draft" JSONB;
ALTER TABLE "GeneratedDocument" ADD COLUMN "revisionCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "GeneratedDocument" ADD COLUMN "draftError" TEXT;

-- The reviewed file's PDF, and when the review came back.
ALTER TABLE "DocumentReview" ADD COLUMN "reviewedPdfUrl" TEXT;
ALTER TABLE "DocumentReview" ADD COLUMN "returnedAt" TIMESTAMP(3);

-- The in-app inbox.
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "href" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Browsers subscribed to web push.
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
