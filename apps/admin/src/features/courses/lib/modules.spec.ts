import type { CourseModule } from "../api/coursesApi";

import {
  addModule,
  moveModule,
  removeModule,
  renumber,
  updateModule,
  validateModules,
} from "./modules";

const mod = (overrides: Partial<CourseModule> = {}): CourseModule => ({
  title: "Introduction",
  order: 0,
  videoAssetId: "ea95132c15732412d22c1476fa83f27a",
  ...overrides,
});

/**
 * The API rejects duplicate `order` values outright, so the invariant these
 * helpers must never break is: after any mutation, order === list position.
 */
const ordersOf = (modules: CourseModule[]) => modules.map((m) => m.order);

describe("module ordering", () => {
  const three = [
    mod({ title: "A", order: 0 }),
    mod({ title: "B", order: 1 }),
    mod({ title: "C", order: 2 }),
  ];

  it("renumbers to match list position", () => {
    const scrambled = [
      mod({ title: "A", order: 7 }),
      mod({ title: "B", order: 3 }),
    ];
    expect(ordersOf(renumber(scrambled))).toEqual([0, 1]);
  });

  it("keeps orders contiguous after a move", () => {
    const moved = moveModule(three, 2, 0);
    expect(moved.map((m) => m.title)).toEqual(["C", "A", "B"]);
    expect(ordersOf(moved)).toEqual([0, 1, 2]);
  });

  // Removing from the middle is where a naive implementation leaves a gap,
  // which the API would accept but playback order would then be misleading.
  it("closes the gap after removing a middle module", () => {
    const removed = removeModule(three, 1);
    expect(removed.map((m) => m.title)).toEqual(["A", "C"]);
    expect(ordersOf(removed)).toEqual([0, 1]);
  });

  it("appends with the next position", () => {
    expect(ordersOf(addModule(three))).toEqual([0, 1, 2, 3]);
  });

  it("never produces duplicate positions across a sequence of edits", () => {
    let modules = addModule(addModule(addModule([])));
    modules = moveModule(modules, 0, 2);
    modules = removeModule(modules, 1);
    modules = addModule(modules);
    expect(new Set(ordersOf(modules)).size).toBe(modules.length);
    expect(ordersOf(modules)).toEqual([0, 1, 2]);
  });

  it("returns the list unchanged for an out-of-bounds move", () => {
    expect(moveModule(three, 0, -1)).toBe(three);
    expect(moveModule(three, 2, 3)).toBe(three);
  });

  it("updates one module without touching the others", () => {
    const next = updateModule(three, 1, { title: "Renamed" });
    expect(next[1]?.title).toBe("Renamed");
    expect(next[0]).toBe(three[0]);
    expect(next[2]).toBe(three[2]);
  });
});

describe("validateModules", () => {
  it("accepts well-formed modules", () => {
    expect(validateModules([mod()])).toEqual([]);
  });

  it("requires a title", () => {
    const problems = validateModules([mod({ title: "  " })]);
    expect(problems.some((p) => p.message.includes("title is required"))).toBe(
      true,
    );
  });

  // A missing Stream UID renders an empty player for a paying customer —
  // no error anywhere, just nothing to watch.
  it("requires a Cloudflare Stream video id", () => {
    const problems = validateModules([mod({ videoAssetId: "" })]);
    expect(problems.some((p) => p.message.includes("video ID"))).toBe(true);
  });

  it("reports the index of each offending module", () => {
    const problems = validateModules([mod(), mod({ title: "" })]);
    expect(problems).toHaveLength(1);
    expect(problems[0]?.index).toBe(1);
  });
});
