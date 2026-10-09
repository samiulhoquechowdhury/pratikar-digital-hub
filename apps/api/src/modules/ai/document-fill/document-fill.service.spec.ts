import { NotFoundException, ServiceUnavailableException } from "@nestjs/common";

import type { PrismaService } from "../../../prisma/prisma.service";

import { DocumentFillService } from "./document-fill.service";
import { FILL_SYSTEM_PROMPT } from "./fill-prompt";

const FIELD_SCHEMA = [
  { key: "tenant", label: "Tenant's name", type: "text", required: true },
  { key: "rent", label: "Monthly rent", type: "number", required: true },
  { key: "start", label: "Start date", type: "date", required: true },
  {
    key: "furnished",
    label: "Furnishing",
    type: "select",
    required: false,
    options: [
      { value: "furnished", label: "Furnished" },
      { value: "unfurnished", label: "Unfurnished" },
    ],
  },
];

describe("DocumentFillService", () => {
  const modelSays = (reply: string, answers: Record<string, unknown>) => ({
    model: "claude-opus-5-5",
    stop_reason: "end_turn",
    content: [{ type: "text", text: JSON.stringify({ reply, answers }) }],
    usage: { input_tokens: 10, output_tokens: 10 },
  });

  const build = ({
    template = {
      title: "Rent Agreement",
      fieldSchema: FIELD_SCHEMA,
    },
    withClient = true,
  }: {
    /** null: no published template with that id. */
    template?: { title: string; fieldSchema: unknown } | null;
    withClient?: boolean;
  } = {}) => {
    const create = jest.fn<Promise<unknown>, [unknown]>();
    const prisma = {
      template: { findFirst: jest.fn().mockResolvedValue(template) },
    };
    const service = new DocumentFillService(
      (withClient ? { beta: { messages: { create } } } : null) as never,
      prisma as unknown as PrismaService,
    );
    return { service, create, prisma };
  };

  const say = (content: string) => [{ role: "user" as const, content }];

  it("records valid answers and lists what's still missing", async () => {
    const { service, create } = build();
    create.mockResolvedValue(
      modelSays("Thanks. When does it start?", {
        tenant: "A. Banerjee",
        rent: 18000,
        start: null,
        furnished: null,
      }),
    );

    const result = await service.fill(
      "t1",
      say("Tenant A. Banerjee, rent 18k"),
    );

    expect(result).toEqual({
      reply: "Thanks. When does it start?",
      answers: { tenant: "A. Banerjee", rent: 18000 },
      missing: [{ key: "start", label: "Start date" }],
      unclear: [],
      complete: false,
    });
  });

  // The worst failure is a wrong field in a legal document: a value the
  // model returns that doesn't validate is dropped and flagged, not kept.
  it("drops a value that fails validation and flags it as unclear", async () => {
    const { service, create } = build();
    create.mockResolvedValue(
      modelSays("Got it.", {
        tenant: "A",
        rent: 1,
        start: "2026-02-30",
        furnished: null,
      }),
    );

    const result = await service.fill("t1", say("starts 30 Feb"));

    expect(result.answers.start).toBeUndefined();
    expect(result.unclear).toEqual([{ key: "start", label: "Start date" }]);
    expect(result.complete).toBe(false);
  });

  it("never lets the model's null erase an answer already given", async () => {
    const { service, create } = build();
    create.mockResolvedValue(
      modelSays("And the start date?", {
        tenant: null,
        rent: null,
        start: null,
        furnished: null,
      }),
    );

    const result = await service.fill("t1", say("hmm"), {
      tenant: "A. Banerjee",
      rent: 18000,
    });

    expect(result.answers).toEqual({ tenant: "A. Banerjee", rent: 18000 });
  });

  it("takes a correction over the earlier answer", async () => {
    const { service, create } = build();
    create.mockResolvedValue(
      modelSays("Updated.", {
        tenant: "A. Banerjee",
        rent: 20000,
        start: null,
        furnished: null,
      }),
    );

    const result = await service.fill("t1", say("sorry, rent is 20,000"), {
      tenant: "A. Banerjee",
      rent: 18000,
    });

    expect(result.answers.rent).toBe(20000);
  });

  // Complete is worked out here, from validated answers — not taken from the
  // model saying so.
  it("is complete only when every required field validates", async () => {
    const { service, create } = build();
    create.mockResolvedValue(
      modelSays("All done — check the form below.", {
        tenant: "A. Banerjee",
        rent: 18000,
        start: "2026-11-01",
        furnished: null,
      }),
    );

    const result = await service.fill("t1", say("starts 1 Nov 2026"));

    expect(result.complete).toBe(true);
    expect(result.missing).toEqual([]);
  });

  // The browser's copy of the answers is input like any other.
  it("re-checks the answers the browser sends back", async () => {
    const { service, create } = build();
    create.mockResolvedValue(
      modelSays("OK.", {
        tenant: null,
        rent: null,
        start: null,
        furnished: null,
      }),
    );

    const result = await service.fill("t1", say("next"), {
      tenant: "A. Banerjee",
      furnished: "semi-furnished",
      injected: "x",
    });

    expect(result.answers).toEqual({ tenant: "A. Banerjee" });
  });

  it("asks for this template's fields, typed, with the fixed prompt cached", async () => {
    const { service, create } = build();
    create.mockResolvedValue(
      modelSays("Hi.", {
        tenant: null,
        rent: null,
        start: null,
        furnished: null,
      }),
    );

    await service.fill("t1", say("hello"), { tenant: "A" });

    const firstCall: unknown = create.mock.calls[0]?.[0];
    const params = firstCall as {
      output_config: {
        effort: string;
        format: {
          type: string;
          schema: { properties: { answers: { required: string[] } } };
        };
      };
      system: { text: string; cache_control?: unknown }[];
      messages: { role: string; content: string }[];
    };
    expect(params.output_config.effort).toBe("medium");
    expect(params.output_config.format.type).toBe("json_schema");
    expect(
      params.output_config.format.schema.properties.answers.required,
    ).toEqual(["tenant", "rent", "start", "furnished"]);
    expect(params.system[0]!.text).toBe(FILL_SYSTEM_PROMPT);
    expect(params.system[1]!.text).toContain(
      "rent: Monthly rent [number] (required)",
    );
    expect(params.system[1]!.cache_control).toEqual({ type: "ephemeral" });
    expect(params.messages.at(-1)!.content).toBe(
      '<current_answers>{"tenant":"A"}</current_answers>\n\nhello',
    );
  });

  it("keeps the answers and carries on when the model refuses", async () => {
    const { service, create } = build();
    create.mockResolvedValue({
      ...modelSays("", {}),
      stop_reason: "refusal",
      content: [],
    });

    const result = await service.fill("t1", say("something off-topic"), {
      tenant: "A",
    });

    expect(result.answers).toEqual({ tenant: "A" });
    expect(result.reply).toMatch(/fill in the form below/);
  });

  it("asks again, rather than failing, when the reply can't be read", async () => {
    const { service, create } = build();
    create.mockResolvedValue({
      ...modelSays("", {}),
      content: [{ type: "text", text: "not json" }],
    });

    const result = await service.fill("t1", say("hello"), { tenant: "A" });

    expect(result.answers).toEqual({ tenant: "A" });
    expect(result.reply).toMatch(/say that again/);
  });

  it("404s for a template that isn't published", async () => {
    const { service } = build({ template: null });

    await expect(service.fill("t1", say("hi"))).rejects.toThrow(
      NotFoundException,
    );
  });

  it("says not configured, before anything else, without a model key", async () => {
    const { service, prisma } = build({ withClient: false });

    await expect(service.fill("t1", say("hi"))).rejects.toThrow(
      new ServiceUnavailableException("AI_NOT_CONFIGURED"),
    );
    expect(prisma.template.findFirst).not.toHaveBeenCalled();
  });
});
