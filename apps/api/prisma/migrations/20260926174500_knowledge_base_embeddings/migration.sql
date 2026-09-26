-- pgvector. Needs an image that ships the extension: pgvector/pgvector locally
-- (docker-compose.yml), and a pgvector-capable Postgres on Railway — the stock
-- one does not have it, and this statement would stop the deploy there.
CREATE EXTENSION IF NOT EXISTS "vector";

-- DropIndex
DROP INDEX "KnowledgeBaseDocument_sourceType_sourceId_idx";

-- AlterTable
-- NOT NULL without a default is safe only because nothing has ever written to
-- this table: it existed in the schema before any code used it.
ALTER TABLE "KnowledgeBaseDocument" ADD COLUMN     "contentHash" TEXT NOT NULL,
ADD COLUMN     "embedding" vector(1024) NOT NULL,
ADD COLUMN     "embeddingModel" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeBaseDocument_sourceType_sourceId_key" ON "KnowledgeBaseDocument"("sourceType", "sourceId");

-- No approximate-nearest-neighbour index (HNSW) yet: the whole catalogue is a
-- few thousand rows, which an exact scan answers in milliseconds, and Prisma
-- cannot describe an HNSW index — adding one by hand here would show up as
-- drift on the next `migrate dev`. Revisit if the knowledge base grows into
-- the tens of thousands.
