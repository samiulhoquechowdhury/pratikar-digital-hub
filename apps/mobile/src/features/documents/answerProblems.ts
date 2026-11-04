/**
 * Mirrors AnswerProblem in apps/api/src/modules/documents/filled-data.ts —
 * the reasons the API gives for refusing an answer.
 */
export type AnswerProblem =
  "missing" | "not-a-number" | "not-a-date" | "not-an-option" | "too-long";

const WHY: Record<AnswerProblem, string> = {
  missing: "is required",
  "not-a-number": "needs to be a number",
  "not-a-date": "needs to be a real date",
  "not-an-option": "needs one of the listed options",
  "too-long": "is too long",
};

interface Problem {
  label: string;
  problem: AnswerProblem;
}

/**
 * What to tell the customer when the API refuses their answers. apiClient
 * throws `API error 400: <body>`; the body lists each field and why.
 * Returns null for any other failure, so the caller keeps its generic message.
 */
export function describeAnswerProblems(error: unknown): string | null {
  const match = /^API error 400: ([\s\S]*)$/.exec(
    error instanceof Error ? error.message : "",
  );
  if (!match) return null;
  try {
    const body = JSON.parse(match[1]!) as {
      message?: string;
      problems?: Problem[];
    };
    if (body.message !== "INVALID_ANSWERS" || !body.problems?.length) {
      return null;
    }
    const list = body.problems
      .map((p) => `${p.label} ${WHY[p.problem] ?? "needs checking"}`)
      .join("; ");
    return `Please check your answers: ${list}.`;
  } catch {
    return null;
  }
}
