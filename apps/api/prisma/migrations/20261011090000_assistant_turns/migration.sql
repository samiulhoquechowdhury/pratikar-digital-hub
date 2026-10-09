-- Questions to the site assistant, kept for 90 days to learn what customers
-- ask and what the catalogue is missing.
CREATE TABLE "AssistantTurn" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "hitCount" INTEGER NOT NULL,
    "citedCount" INTEGER NOT NULL,
    "cited" JSONB NOT NULL,
    "suggestedDraft" BOOLEAN NOT NULL DEFAULT false,
    "refused" BOOLEAN NOT NULL DEFAULT false,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssistantTurn_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AssistantTurn_createdAt_idx" ON "AssistantTurn"("createdAt");
CREATE INDEX "AssistantTurn_conversationId_idx" ON "AssistantTurn"("conversationId");
CREATE INDEX "AssistantTurn_userId_idx" ON "AssistantTurn"("userId");
ALTER TABLE "AssistantTurn" ADD CONSTRAINT "AssistantTurn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
