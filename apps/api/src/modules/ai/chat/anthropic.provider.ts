import Anthropic from "@anthropic-ai/sdk";
import type { Provider } from "@nestjs/common";

export const ANTHROPIC_CLIENT = Symbol("ANTHROPIC_CLIENT");

/**
 * The Anthropic client, or null when no key is set.
 *
 * Null rather than a client that fails on first use: without a key the chat
 * endpoint answers "not configured" straight away, and the site falls back
 * to its scripted preview, instead of every question waiting on a request
 * that was always going to be rejected.
 *
 * One retry, not the SDK's default two: someone is watching a spinner, and a
 * third attempt at an overloaded API is usually worse than a prompt "try
 * again".
 */
export const anthropicProvider: Provider = {
  provide: ANTHROPIC_CLIENT,
  useFactory: (): Anthropic | null =>
    process.env.ANTHROPIC_API_KEY
      ? new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
          maxRetries: 1,
          timeout: 60_000,
        })
      : null,
};
