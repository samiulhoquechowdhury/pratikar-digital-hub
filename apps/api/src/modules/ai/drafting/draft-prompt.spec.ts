import { briefBlock, parseDraft } from "./draft-prompt";

describe("parseDraft", () => {
  const valid = {
    title: "Affidavit",
    blocks: [
      { kind: "paragraph", text: "I, __________, state:" },
      { kind: "clause", text: "That I reside at Pune." },
      { kind: "bogus", text: "dropped" },
      { kind: "clause", text: "   " },
    ],
    missingDetails: ["Deponent's name"],
    summary: "An affidavit of residence.",
    declined: null,
  };

  it("keeps known, non-empty blocks", () => {
    const draft = parseDraft(JSON.stringify(valid))!;
    expect(draft.blocks.map((b) => b.kind)).toEqual(["paragraph", "clause"]);
    expect(draft.missingDetails).toEqual(["Deponent's name"]);
  });

  it("returns a decline as a decline", () => {
    const draft = parseDraft(
      JSON.stringify({
        ...valid,
        blocks: [],
        declined: "Not a legal document.",
      }),
    )!;
    expect(draft.declined).toBe("Not a legal document.");
  });

  it("rejects output cut off mid-JSON", () => {
    expect(parseDraft(JSON.stringify(valid).slice(0, 40))).toBeNull();
  });

  it("rejects a draft with nothing in it and no reason", () => {
    expect(parseDraft(JSON.stringify({ ...valid, blocks: [] }))).toBeNull();
  });
});

describe("briefBlock", () => {
  it("names the state, or says none was given", () => {
    expect(
      briefBlock({ documentType: "Will", details: "x", stateCode: "27" }),
    ).toContain("State: Maharashtra");
    expect(briefBlock({ documentType: "Will", details: "x" })).toContain(
      "State: not given",
    );
  });
});
