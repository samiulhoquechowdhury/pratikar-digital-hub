import type { ReadinessCheck } from "../api/readinessApi";

import { groupChecks } from "./group";

const check = (
  area: string,
  id: string,
  status: ReadinessCheck["status"],
): ReadinessCheck => ({ id, area, label: id, status, detail: "" });

describe("groupChecks", () => {
  it("puts the areas with failures first, and failures first within them", () => {
    const groups = groupChecks([
      check("AI", "a", "warn"),
      check("Payments", "p1", "ok"),
      check("Payments", "p2", "fail"),
      check("Services", "s", "ok"),
    ]);
    expect(groups.map((g) => g.area)).toEqual(["Payments", "AI", "Services"]);
    expect(groups[0]!.checks.map((c) => c.id)).toEqual(["p2", "p1"]);
  });
});
