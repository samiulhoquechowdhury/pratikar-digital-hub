-- Service API keys entered by a Super Admin, encrypted at rest.
CREATE TABLE "IntegrationSecret" (
    "key" TEXT NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationSecret_pkey" PRIMARY KEY ("key")
);
