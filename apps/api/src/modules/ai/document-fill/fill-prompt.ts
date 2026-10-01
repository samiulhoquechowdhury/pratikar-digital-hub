import type { TemplateField } from "@pratikar/types";

/**
 * The AI document generator's instructions and output shape.
 *
 * The model's job is narrow on purpose: turn what a customer says into the
 * template's fields, and ask for what's missing. It never produces the
 * document — the answers go back into the ordinary form, where the customer
 * reads every one before generating. Everything here is written around the
 * failure the implementation plan names as this product's worst: a wrong
 * field in a legal document.
 */
export const FILL_SYSTEM_PROMPT = `You help a customer of Pratikar Digital Hub, an Indian legal documents website, fill in a document template by conversation instead of a form.

Each turn you receive the template's fields, the answers recorded so far, and the customer's latest message. You reply with the updated answers and a short message to the customer.

Recording answers — this is a legal document, so accuracy matters more than speed:
- Record a value only when the customer has stated it. Never guess, infer, or fill in a typical value. A name, an amount or a date you made up is worse than a blank.
- If a value is ambiguous — "03/04/2026" could be March or April; "Sharma" could be either party — do not record it. Ask.
- Dates: record as YYYY-MM-DD, only when the day, month and year are all clear.
- Numbers: record digits only, no currency symbols or words ("₹18,000" -> 18000; "eighteen thousand" -> 18000).
- For a field with a fixed list of options, record only one of the listed option values, exactly.
- Carry forward every answer already recorded, unless the customer corrects it. Use null for anything not yet given.

Talking to the customer:
- Ask for what's still missing, a few related fields at a time, in plain language. Start with the required fields.
- When something they said was unclear, say what, and ask.
- When every required field is answered, say so and tell them to check the answers in the form below before generating.
- Don't give legal advice about their situation. If they ask for it, say that a lawyer's review can be added to the document.
- Reply in the language the customer writes in. Keep it to two or three sentences.`;

/** The template block that follows the fixed prompt — stable per template. */
export function templateBlock(title: string, fields: TemplateField[]): string {
  const lines = fields.map((field) => {
    const kind =
      field.type === "select"
        ? `one of: ${(field.options ?? []).map((o) => `"${o.value}" (${o.label})`).join(", ")}`
        : field.type === "date"
          ? "date, YYYY-MM-DD"
          : field.type === "number"
            ? "number"
            : "text";
    return `- ${field.key}: ${field.label} [${kind}]${field.required ? " (required)" : ""}`;
  });
  return `<template title="${title.replace(/"/g, "'")}">\n${lines.join("\n")}\n</template>`;
}

/**
 * The response shape, built from the template so the model can only return
 * this template's fields, each typed — a select can only hold one of its own
 * options. Every answer is nullable so "not given yet" is explicit rather
 * than an omitted key.
 */
export function fillOutputSchema(fields: TemplateField[]) {
  const nullable = (schema: Record<string, unknown>) => ({
    anyOf: [schema, { type: "null" }],
  });

  const answerSchema = (field: TemplateField) => {
    switch (field.type) {
      case "number":
        return nullable({ type: "number", description: field.label });
      case "select":
        return nullable({
          type: "string",
          enum: (field.options ?? []).map((o) => o.value),
          description: field.label,
        });
      case "date":
        return nullable({
          type: "string",
          description: `${field.label} (YYYY-MM-DD)`,
        });
      default:
        return nullable({ type: "string", description: field.label });
    }
  };

  return {
    type: "object",
    additionalProperties: false,
    required: ["reply", "answers"],
    properties: {
      reply: {
        type: "string",
        description: "What to say to the customer next.",
      },
      answers: {
        type: "object",
        additionalProperties: false,
        required: fields.map((f) => f.key),
        properties: Object.fromEntries(
          fields.map((f) => [f.key, answerSchema(f)]),
        ),
      },
    },
  };
}
