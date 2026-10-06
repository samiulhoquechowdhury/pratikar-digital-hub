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
      kind: "Document template",
      content: "Rent Agreement\nA document template.",
      score: 0.62,
    },
    {
      sourceType: "course",
      sourceId: "c1",
      title: "GST for Freelancers",
      priceInPaise: 249900,
      href: "/courses/c1",
      kind: "Course",
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
    expect(content).toContain(
      "[1] Rent Agreement (Document template) — ₹349.00 + GST",
    );
    expect(content.endsWith("I need a rental agreement")).toBe(true);
  });

  it("searches a short follow-up with the question before it, and keeps the history as said", async () => {
    const { service, search, create } = build();
    create!.mockResolvedValue(reply("It's [1]."));

    await service.answer([
      { role: "assistant", content: "Hi! What can I help with?" },
      { role: "user", content: "rent agreement" },
      { role: "assistant", content: "Try [1]." },
      { role: "user", content: "how much is it?" },
    ]);

    expect(search.search).toHaveBeenCalledWith(
      "rent agreement\nhow much is it?",
      8,
    );
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
    expect(result.suggestDraft).toBe(false);
    expect(result.sources).toEqual([
      {
        sourceType: "template",
        sourceId: "t1",
        title: "Rent Agreement",
        href: "/documents/t1",
        priceInPaise: 34900,
        kind: "Document template",
      },
    ]);
  });

  it("turns the [draft] marker into the custom-draft offer", async () => {
    const { service, create } = build({ hits: [] });
    create!.mockResolvedValue(
      reply("We can draft a partnership deed for you. [draft]"),
    );

    const result = await service.answer(ask("partnership deed"));

    expect(result.suggestDraft).toBe(true);
    expect(result.answer).toBe("We can draft a partnership deed for you.");
  });

  it("searches a full question on its own", async () => {
    const { service, search, create } = build();
    create!.mockResolvedValue(reply("Try [1]."));
    const long =
      "I am renting out my flat in Pune to a family and need a written agreement";

    await service.answer([
      { role: "user", content: "earlier question" },
      { role: "assistant", content: "ok" },
      { role: "user", content: long },
    ]);

    expect(search.search).toHaveBeenCalledWith(long, 8);
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

  describe("streaming", () => {
    /** A stand-in for the SDK's MessageStream: replays events, then resolves. */
    const fakeStream = (events: object[], final: object) => {
      const handlers: ((event: object) => void)[] = [];
      return {
        on: (_name: string, handler: (event: object) => void) => {
          handlers.push(handler);
        },
        finalMessage: () => {
          events.forEach((event) => handlers.forEach((h) => h(event)));
          return Promise.resolve(final);
        },
      };
    };

    const buildStreaming = (stream: object | Error) => {
      const client = {
        beta: {
          messages: {
            create: jest.fn(),
            stream: jest.fn(() => {
              if (stream instanceof Error) throw stream;
              return stream;
            }),
          },
        },
      };
      return build({ client });
    };

    const delta = (text: string) => ({
      type: "content_block_delta",
      delta: { type: "text_delta", text },
    });

    it("emits the text as it comes, then the finished answer", async () => {
      const { service } = buildStreaming(
        fakeStream([delta("Try "), delta("[1].")], reply("Try [1].")),
      );
      const events: object[] = [];

      await service.streamAnswer(ask("rent"), (e) => events.push(e));

      expect(events).toEqual([
        { type: "delta", text: "Try " },
        { type: "delta", text: "[1]." },
        expect.objectContaining({
          type: "done",
          answer: "Try [1].",
          sources: [expect.objectContaining({ sourceId: "t1" })],
        }),
      ]);
    });

    // The declining model's partial text must not stay on screen.
    it("tells the browser to start over at a fallback", async () => {
      const { service } = buildStreaming(
        fakeStream(
          [
            delta("Partial"),
            {
              type: "content_block_start",
              content_block: { type: "fallback" },
            },
            delta("Fresh"),
          ],
          reply("Fresh"),
        ),
      );
      const events: { type: string }[] = [];

      await service.streamAnswer(ask("rent"), (e) => events.push(e));

      expect(events.map((e) => e.type)).toEqual([
        "delta",
        "reset",
        "delta",
        "done",
      ]);
    });

    it("reports a failure mid-stream as an event", async () => {
      const { service } = buildStreaming(
        new Anthropic.RateLimitError(429, undefined, "busy", new Headers()),
      );
      const events: object[] = [];

      await service.streamAnswer(ask("rent"), (e) => events.push(e));

      expect(events).toEqual([{ type: "error", reason: "AI_BUSY" }]);
    });

    it("still throws before streaming when not configured", async () => {
      const { service } = build({ client: null });

      await expect(
        service.streamAnswer(ask("rent"), jest.fn()),
      ).rejects.toThrow("AI_NOT_CONFIGURED");
    });
  });
});
