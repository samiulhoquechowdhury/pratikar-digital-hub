import type Anthropic from "@anthropic-ai/sdk";

import { DraftingService } from "./drafting.service";

const DRAFT = {
  title: "Partnership Deed",
  blocks: [{ kind: "clause", text: "The partners agree." }],
  missingDetails: [],
  summary: "A deed.",
  declined: null,
};

/** A client whose stream resolves to one text answer; records what it was sent. */
function build() {
  const sent: Anthropic.Beta.MessageCreateParamsNonStreaming[] = [];
  const client = {
    beta: {
      messages: {
        stream: (params: Anthropic.Beta.MessageCreateParamsNonStreaming) => {
          sent.push(params);
          return {
            finalMessage: () =>
              Promise.resolve({
                model: "claude-opus-5-5",
                stop_reason: "end_turn",
                usage: { input_tokens: 1, output_tokens: 1 },
                content: [{ type: "text", text: JSON.stringify(DRAFT) }],
              }),
          };
        },
      },
    },
  };
  return { service: new DraftingService(client as never), sent };
}

const brief = { documentType: "Partnership deed", details: "Two partners" };
const precedent = {
  id: "f1",
  title: "Partnership Deed",
  fileUrl: "library/p.docx",
  text: "THIS DEED OF PARTNERSHIP",
};

describe("DraftingService", () => {
  it("puts the precedents before the request", async () => {
    const { service, sent } = build();

    await service.draft(brief, undefined, [precedent]);

    const content = sent[0]!.messages[0]!.content as string;
    expect(content.indexOf("<precedent")).toBe(0);
    expect(content.indexOf("<request>")).toBeGreaterThan(
      content.indexOf("</precedent>"),
    );
  });

  it("sends only the request when there are none", async () => {
    const { service, sent } = build();

    await service.draft(brief);

    expect(sent[0]!.messages[0]!.content as string).not.toContain("<precedent");
  });

  // The references are the worker's record, not something the model wrote.
  it("echoes a revised draft without its references", async () => {
    const { service, sent } = build();

    await service.draft(
      brief,
      {
        previous: { ...DRAFT, references: [precedent] } as never,
        instruction: "Add a third partner",
      },
      [precedent],
    );

    const [first, echo, change] = sent[0]!.messages;
    expect(first!.content as string).toContain("<precedent");
    expect(echo!.content as string).not.toContain("references");
    expect(change!.content as string).toContain("Add a third partner");
  });
});
