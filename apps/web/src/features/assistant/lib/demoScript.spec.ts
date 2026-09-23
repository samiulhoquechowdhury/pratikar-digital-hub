import {
  answerById,
  answerFor,
  DEMO_SCRIPT,
  FALLBACK,
  STARTER_QUESTIONS,
} from "./demoScript";

/**
 * The preview replies from a script, so the only thing that can go wrong is
 * which script entry a question selects — and the expensive failure is
 * confidently returning the wrong one. On a site that sells legal documents,
 * answering a GST question with tenancy content is worse than declining.
 */
describe("answerFor", () => {
  it.each([
    ["my tenant hasn't paid rent in three months", "notice"],
    ["do I need to register for GST?", "turnover"],
    ["I want to hire an employee", "offer letter"],
    ["how does an employer verify my certificate", "QR"],
    ["what does the lawyer review include", "reviewer"],
  ])("routes %j to the right entry", (question, marker) => {
    const answer = answerFor(question);
    expect(answer).not.toBe(FALLBACK);
    expect(answer.paragraphs.join(" ")).toContain(marker);
  });

  it("matches word forms, not just exact keywords", () => {
    // "registration" must reach the "register" entry, and "employees" the
    // "employee" one — people don't type the stem.
    expect(answerFor("gst registration threshold")).not.toBe(FALLBACK);
    expect(answerFor("hiring employees offer")).not.toBe(FALLBACK);
  });

  /**
   * The important half. A preview that improvises would be demonstrated to
   * customers as though it were the finished assistant.
   */
  it.each([
    "what's the weather today",
    "can you write my thesis",
    "hello",
    "",
    "   ",
  ])("declines to answer %j rather than guessing", (question) => {
    expect(answerFor(question)).toBe(FALLBACK);
  });

  it("does not let one incidental word select a confident answer", () => {
    // "cost" alone appears in an unrelated question; one hit must not win.
    expect(answerFor("what did it cost")).toBe(FALLBACK);
  });

  it("says plainly that it cannot answer, and offers search", () => {
    expect(FALLBACK.paragraphs[0]).toMatch(/can't answer/i);
    expect(FALLBACK.links?.[0]?.href).toBe("/search");
  });
});

describe("answerById", () => {
  it("returns the exact entry for every starter chip", () => {
    // Chips must never fall back — they are our own questions, and a chip
    // that answers "I can't answer that" reads as broken.
    for (const starter of STARTER_QUESTIONS) {
      expect(answerById(starter.id)).not.toBe(FALLBACK);
    }
    expect(STARTER_QUESTIONS).toHaveLength(DEMO_SCRIPT.length);
  });

  it("falls back for an unknown id", () => {
    expect(answerById("nope")).toBe(FALLBACK);
  });
});

describe("the script itself", () => {
  it("only links to routes that exist in the app", () => {
    const REAL = [
      "/documents",
      "/courses",
      "/content-library",
      "/dashboard",
      "/verify",
      "/search",
    ];
    const links = [...DEMO_SCRIPT, FALLBACK].flatMap((e) => e.links ?? []);
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) expect(REAL).toContain(link.href);
  });

  it("gives no advice — it points at material", () => {
    // Not a safety net, a tripwire: if scripted copy ever starts telling
    // someone what to do, this fails and someone has to think about it.
    const advice = /\byou should\b|\bI recommend\b|\byou must\b|\bwe advise\b/i;
    for (const entry of DEMO_SCRIPT) {
      expect(entry.paragraphs.join(" ")).not.toMatch(advice);
    }
  });

  it("has a unique id per entry", () => {
    const ids = DEMO_SCRIPT.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
