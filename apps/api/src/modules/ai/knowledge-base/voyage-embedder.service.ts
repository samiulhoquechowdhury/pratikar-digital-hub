import { Injectable, Logger } from "@nestjs/common";

import { KNOWLEDGE_BASE_DIMENSIONS } from "./sources";

// Thin wrapper around Voyage AI's embeddings endpoint — the one place that
// changes if the embedding provider does. Global fetch rather than an SDK, as
// with RazorpayService: one endpoint does not justify a dependency.

const ENDPOINT = "https://api.voyageai.com/v1/embeddings";

/** An external hop inside a queue worker; a hung socket would stall the queue. */
const TIMEOUT_MS = 30_000;

/** Multilingual, 1024 dimensions by default. Overridable without a deploy. */
const DEFAULT_MODEL = "voyage-4";

interface VoyageResponse {
  data: { embedding: number[]; index?: number }[];
}

@Injectable()
export class VoyageEmbedder {
  private readonly logger = new Logger(VoyageEmbedder.name);

  private readonly apiKey = process.env.VOYAGE_API_KEY ?? "";
  readonly model = process.env.VOYAGE_EMBEDDING_MODEL || DEFAULT_MODEL;

  /**
   * False in local dev without a key. The worker checks this and skips rather
   * than failing, so a missing key costs an empty knowledge base, not a
   * failed-jobs list that fills up every time someone saves a template.
   */
  get isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  /**
   * Embeds texts that will be searched over. Voyage embeds a document and a
   * query differently (`input_type`), so the chatbot's side of this will need
   * its own call with "query" — using this one for a question would quietly
   * degrade retrieval rather than fail.
   */
  async embedDocuments(texts: string[]): Promise<number[][]> {
    if (!this.isConfigured) throw new Error("VOYAGE_NOT_CONFIGURED");

    let response: Response;
    try {
      response = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: texts,
          model: this.model,
          input_type: "document",
          // Pinned rather than left to the model's default, so a model whose
          // default differs fails loudly below instead of writing vectors
          // the column cannot hold.
          output_dimension: KNOWLEDGE_BASE_DIMENSIONS,
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (cause) {
      throw new Error(`Voyage request failed: ${(cause as Error).message}`);
    }

    const text = await response.text();
    if (!response.ok) {
      // Thrown, not swallowed: the queue's retry with backoff is exactly the
      // right response to a 429 or a Voyage outage.
      this.logger.error(`Voyage returned ${response.status}: ${text}`);
      throw new Error(`VOYAGE_ERROR_${response.status}`);
    }

    const { data } = JSON.parse(text) as VoyageResponse;
    const ordered = [...data].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
    if (ordered.length !== texts.length) {
      throw new Error(
        `Voyage returned ${ordered.length} embeddings for ${texts.length} inputs`,
      );
    }
    for (const { embedding } of ordered) {
      if (embedding.length !== KNOWLEDGE_BASE_DIMENSIONS) {
        throw new Error(
          `Voyage returned ${embedding.length} dimensions, the column holds ${KNOWLEDGE_BASE_DIMENSIONS}`,
        );
      }
    }
    return ordered.map((item) => item.embedding);
  }
}
