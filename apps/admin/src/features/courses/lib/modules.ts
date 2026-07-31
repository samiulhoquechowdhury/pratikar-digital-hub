import type { CourseModule } from "../api/coursesApi";

/**
 * `order` drives playback sequence and the API rejects duplicates outright
 * (DUPLICATE_MODULE_ORDER). Rather than let an operator hand-manage the
 * numbers, the list position *is* the order — these helpers renumber after
 * every mutation so the two can never disagree.
 */
export const renumber = (modules: CourseModule[]): CourseModule[] =>
  modules.map((m, i) => ({ ...m, order: i }));

export const addModule = (modules: CourseModule[]): CourseModule[] =>
  renumber([
    ...modules,
    { title: "", order: modules.length, videoAssetId: "" },
  ]);

export const removeModule = (
  modules: CourseModule[],
  index: number,
): CourseModule[] => renumber(modules.filter((_, i) => i !== index));

export const updateModule = (
  modules: CourseModule[],
  index: number,
  patch: Partial<CourseModule>,
): CourseModule[] =>
  modules.map((m, i) => (i === index ? { ...m, ...patch } : m));

export const moveModule = (
  modules: CourseModule[],
  from: number,
  to: number,
): CourseModule[] => {
  if (to < 0 || to >= modules.length || from === to) return modules;
  const next = [...modules];
  const [moved] = next.splice(from, 1);
  if (!moved) return modules;
  next.splice(to, 0, moved);
  return renumber(next);
};

export interface ModuleProblem {
  index: number;
  message: string;
}

export function validateModules(modules: CourseModule[]): ModuleProblem[] {
  const problems: ModuleProblem[] = [];

  modules.forEach((module, index) => {
    if (!module.title.trim()) {
      problems.push({ index, message: "Module title is required." });
    }
    // Without a Stream UID the module renders as an empty player for a paying
    // customer — no error, just nothing to watch.
    if (!module.videoAssetId.trim()) {
      problems.push({
        index,
        message: "A Cloudflare Stream video ID is required.",
      });
    }
  });

  return problems;
}
