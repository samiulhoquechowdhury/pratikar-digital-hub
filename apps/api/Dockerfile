# Build context is the monorepo root, not apps/api:
#   docker build -f apps/api/Dockerfile -t pratikar-api .
# The API is a workspace package, so the lockfile and packages/* have to be in
# context for pnpm to resolve `workspace:*` dependencies.

# ---------------------------------------------------------------------------
# Stage 1 — build
# ---------------------------------------------------------------------------
FROM node:20-bookworm-slim AS build

# openssl must be present *here*, not just at runtime: `prisma generate` probes
# the OpenSSL version to pick a query engine. Without it Prisma guesses
# debian-openssl-1.1.x, and the container then fails to start with "could not
# locate the Query Engine for runtime debian-openssl-3.0.x".
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

WORKDIR /repo

# Copy the whole workspace: pnpm validates the lockfile against every
# workspace project's package.json, so a partial copy fails --frozen-lockfile.
COPY . .

# `api...` = the api package plus its workspace dependencies, so this doesn't
# pull Next.js and the two frontends into the API image build.
RUN pnpm install --frozen-lockfile --filter api...

RUN pnpm --filter @pratikar/types build
RUN pnpm --filter api build

# Produce a self-contained, production-only node_modules for just the API.
RUN pnpm deploy --filter api --prod /app

# `pnpm deploy` rebuilds node_modules from the store, which discards the client
# generated during install — without this the image starts and immediately dies
# with "Cannot find module '.prisma/client/default'". Generate into the
# deployed tree instead. Needs only the schema, no database connection.
#
# Invoked via the local binary, not `pnpm exec`: /app/package.json carries no
# `packageManager` field, so corepack there resolves to the latest pnpm, which
# requires node:sqlite (Node 22+) and dies on this Node 20 base.
RUN cd /app && ./node_modules/.bin/prisma generate

# ---------------------------------------------------------------------------
# Stage 2 — runtime
# ---------------------------------------------------------------------------
FROM node:20-bookworm-slim AS runtime

# LibreOffice is a hard runtime dependency, not an optional extra: the
# document-generation worker shells out to `soffice` to convert the filled
# DOCX to a preview PDF (see document-generation.processor.ts). Without it
# every generation job fails at the conversion step.
#
# -writer rather than the full suite — Writer is all the DOCX->PDF path needs,
# and it keeps the image substantially smaller. The font packages matter too:
# with no fonts installed LibreOffice still exits 0 but renders a garbled PDF.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libreoffice-writer-nogui \
        fonts-liberation \
        fonts-dejavu-core \
        openssl \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=build /app ./

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

# Run pending migrations before serving. Railway runs one instance per deploy,
# so this is safe here; revisit if the API ever scales to multiple replicas
# starting concurrently.
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/main.js"]
