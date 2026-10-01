import Anthropic from "@anthropic-ai/sdk";
import {
  BadRequestException,
  ServiceUnavailableException,
} from "@nestjs/common";

import type {
  KnowledgeBaseSearch,
  KnowledgeHit,
} from "../knowledge-base/knowledge-base-search.service";
import { VoyageRateLimitedError } from "../knowledge-base/voyage-embedder.service";

import { SYSTEM_PROMPT } from "./chat.prompt";
import { ChatService } from "./chat.service";

type CreateParams = Anthropic.Beta.Messages.MessageCreateParamsNonStreaming;
type CreateMock = jest.Mock<Promise<unknown>, [CreateParams]>;

/** The request the service sent, typed, so assertions read real fields. */
const sent = (create: CreateMock | undefined, call = 0): CreateParams =>
  create!.mock.calls[call]![0];

describe("ChatService", () => {
  const HITS: KnowledgeHit[] = [
    {
      sourceType: "template",
      sourceId: "t1",
      title: "Rent Agreement",
      priceInPaise: 34900,
      href: "/documents/t1",
      content: "Rent Agreement\nA document template.",
      score: 0.62,
    },
    {
      sourceType: "course",
      sourceId: "c1",
      title: "GST for Freelancers",
      priceInPaise: 249900,
      href: "/courses/c1",
      content: "GST for Freelancers\nAn online video course.",
      score: 0.45,
    },
  ];

  const reply = (text: string, stop_reason = "end_turn") => ({
    model: "claude-opus-5-5",
    stop_reason,
    content: [{ type: "text", text }],
    usage: { input_tokens: 100, output_tokens: 20 },
  });

  const build = ({
    client = { beta: { messages: { create: jest.fn() } } },
    hits = HITS,
    searchConfigured = true,
  }: {
    client?: object | null;
    hits?: KnowledgeHit[];
    searchConfigured?: boolean;
  } = {}) => {
    const search = {
      isConfigured: searchConfigured,
      search: jest.fn().mockResolvedValue(hits),
    };
    const service = new ChatService(
      client as Anthropic | null,
      search as unknown as KnowledgeBaseSearch,
    );
    const create = (
      client as { beta: { messages: { create: CreateMock } } } | null
    )?.beta.messages.create;
    return { service, search, create };
  };

  const ask = (content: string) => [{ role: "user" as const, content }];

  it("refuses to run without a model key, before calling anything", async () => {
    const { service, search } = build({ client: null });

    await expect(service.answer(ask("hi"))).rejects.toThrow(
      new ServiceUnavailableException("AI_NOT_CONFIGURED"),
    );
    expect(search.search).not.toHaveBeenCalled();
  });

  it("refuses to run without a search index", async () => {
    const { service } = build({ searchConfigured: false });

    await expect(service.answer(ask("hi"))).rejects.toThrow(
      "AI_NOT_CONFIGURED",
    );
  });

  it("sends the question with its catalogue, at low effort, with fallbacks", async () => {
    const { service, create } = build();
    create!.mockResolvedValue(reply("Try [1]."));

    await service.answer(ask("I need a rental agreement"));

    const params = sent(create);
    expect(params).toMatchObject({
      model: "claude-opus-5-5",
      output_config: { effort: "low" },
      fallbacks: "default",
      betas: ["server-side-fallback-2026-07-01"],
    });
    // The system prompt is the fixed text, marked for caching.
    expect(params.system).toEqual([
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ]);
    const last = params.messages.at(-1)!;
    // The service always sends the new turn as one string.
    const content = last.content as string;
    expect(last.role).toBe("user");
    expect(content).toContain("[1] Rent Agreement — ₹349.00 + GST");
    expect(content.endsWith("I need a rental agreement")).toBe(true);
  });

  it("searches on the new question only, and keeps the history as said", async () => {
    const { service, search, create } = build();
    create!.mockResolvedValue(reply("It's [1]."));

    await service.answer([
      { role: "assistant", content: "Hi! What can I help with?" },
      { role: "user", content: "rent agreement" },
      { role: "assistant", content: "Try [1]." },
      { role: "user", content: "how much is it?" },
    ]);

    expect(search.search).toHaveBeenCalledWith("how much is it?");
    const { messages } = sent(create);
    // The browser's greeting is dropped: a conversation opens with the user.
    expect(messages.map((m) => m.role)).toEqual(["user", "assistant", "user"]);
    expect(messages[0]!.content).toBe("rent agreement");
  });

  it("returns only the sources the answer cites", async () => {
    const { service, create } = build();
    create!.mockResolvedValue(reply("For your flat, [1] fits."));

    const result = await service.answer(ask("rent"));

    expect(result.answer).toBe("For your flat, [1] fits.");
    expect(result.sources).toEqual([
      {
        sourceType: "template",
        sourceId: "t1",
        title: "Rent Agreement",
        href: "/documents/t1",
        priceInPaise: 34900,
      },
    ]);
  });

  it("answers a refusal with a plain no, and no sources", async () => {
    const { service, create } = build();
    create!.mockResolvedValue(reply("", "refusal"));

    const result = await service.answer(ask("something off-topic"));

    expect(result.sources).toEqual([]);
    expect(result.answer).toMatch(/can't help with that/);
  });

  it("reports an overloaded model as temporary", async () => {
    const { service, create } = build();
    create!.mockRejectedValue(
      new Anthropic.RateLimitError(
        429,
        undefined,
        "rate limited",
        new Headers(),
      ),
    );

    await expect(service.answer(ask("rent"))).rejects.toThrow(
      new ServiceUnavailableException("AI_BUSY"),
    );
  });

  it("reports a rate-limited search as temporary too", async () => {
    const { service, search } = build();
    search.search.mockRejectedValue(new VoyageRateLimitedError());

    await expect(service.answer(ask("rent"))).rejects.toThrow("AI_BUSY");
  });

  it("rejects a conversation that doesn't end with a question", async () => {
    const { service } = build();

    await expect(
      service.answer([{ role: "assistant", content: "Hello" }]),
    ).rejects.toThrow(BadRequestException);
  });
});
