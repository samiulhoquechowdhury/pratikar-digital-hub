import type { TemplateField } from "@pratikar/types";

import { fillOutputSchema, templateBlock } from "./fill-prompt";

const FIELDS: TemplateField[] = [
  { key: "name", label: "Name", type: "text", required: true },
  { key: "rent", label: "Rent", type: "number", required: true },
  {
    key: "kind",
    label: "Kind",
    type: "select",
    required: false,
    options: [
      { value: "a", label: "A" },
      { value: "b", label: "B" },
    ],
  },
];

describe("fillOutputSchema", () => {
  const schema = fillOutputSchema(FIELDS);
  const answers = schema.properties.answers;

  it("has exactly this template's fields, all required, nothing extra", () => {
    expect(answers.required).toEqual(["name", "rent", "kind"]);
    expect(answers.additionalProperties).toBe(false);
  });

  it("types each field and allows null for not-yet-given", () => {
    expect(answers.properties.rent).toEqual({
      anyOf: [{ type: "number", description: "Rent" }, { type: "null" }],
    });
  });

  // The model can't invent an option the template doesn't have.
  it("limits a select to its own option values", () => {
    expect(answers.properties.kind!.anyOf[0]).toMatchObject({
      enum: ["a", "b"],
    });
  });
});

describe("templateBlock", () => {
  it("lists each field with its type and whether it's required", () => {
    const block = templateBlock('Rent "Agreement"', FIELDS);

    expect(block).toContain(`<template title="Rent 'Agreement'">`);
    expect(block).toContain("- name: Name [text] (required)");
    expect(block).toContain('- kind: Kind [one of: "a" (A), "b" (B)]');
  });
});
