import Anthropic from "@anthropic-ai/sdk";
import type { Provider } from "@nestjs/common";

import {
  IntegrationsService,
  liveSetting,
} from "../../integrations/integrations.service";

export const ANTHROPIC_CLIENT = Symbol("ANTHROPIC_CLIENT");

/**
 * The Anthropic client for whichever key is current — rebuilt when a new one
 * is saved in Integrations, null while there's none.
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
export class AnthropicSource {
  private built: { key: string; client: Anthropic } | null = null;

  constructor(private readonly integrations?: IntegrationsService) {}

  current(): Anthropic | null {
    const key = liveSetting(this.integrations, "ANTHROPIC_API_KEY");
    if (!key) return null;
    if (this.built?.key !== key) {
      this.built = {
        key,
        client: new Anthropic({ apiKey: key, maxRetries: 1, timeout: 60_000 }),
      };
    }
    return this.built.client;
  }

  model(): string {
    return liveSetting(this.integrations, "ANTHROPIC_MODEL");
  }
}

/** What a service is given: the live source — or, in a test, a stand-in. */
export type AnthropicInjection = AnthropicSource | Anthropic | null;

export const liveClient = (injected: AnthropicInjection): Anthropic | null =>
  injected instanceof AnthropicSource ? injected.current() : injected;

export const liveModel = (injected: AnthropicInjection, fallback: string) =>
  (injected instanceof AnthropicSource
    ? injected.model()
    : process.env.ANTHROPIC_MODEL) || fallback;

export const anthropicProvider: Provider = {
  provide: ANTHROPIC_CLIENT,
  inject: [IntegrationsService],
  useFactory: (integrations: IntegrationsService) =>
    new AnthropicSource(integrations),
};
