import type { CheckStatus, ReadinessCheck } from "../api/readinessApi";

const RANK: Record<CheckStatus, number> = { fail: 0, warn: 1, ok: 2 };

/**
 * Checks grouped by area, the areas with something wrong first and, inside
 * each, failures before warnings before passes — what needs doing at the top.
 */
export function groupChecks(checks: ReadinessCheck[]) {
  const areas = new Map<string, ReadinessCheck[]>();
  for (const check of checks) {
    areas.set(check.area, [...(areas.get(check.area) ?? []), check]);
  }
  return [...areas.entries()]
    .map(([area, items]) => ({
      area,
      checks: [...items].sort((a, b) => RANK[a.status] - RANK[b.status]),
      worst: Math.min(...items.map((c) => RANK[c.status])),
    }))
    .sort((a, b) => a.worst - b.worst)
    .map(({ area, checks: sorted }) => ({ area, checks: sorted }));
}
