import type { QuizQuestionDraft } from "@pratikar/types";

/**
 * Pure helpers for the quiz builder, kept out of the component for the same
 * reason lib/modules is: reordering and validation are where the bugs live,
 * and they're worth testing without a DOM.
 */

export const emptyQuestion = (): QuizQuestionDraft => ({
  prompt: "",
  options: [
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
  ],
});

export const addQuestion = (
  questions: QuizQuestionDraft[],
): QuizQuestionDraft[] => [...questions, emptyQuestion()];

export const removeQuestion = (
  questions: QuizQuestionDraft[],
  index: number,
): QuizQuestionDraft[] => questions.filter((_, i) => i !== index);

export const updateQuestion = (
  questions: QuizQuestionDraft[],
  index: number,
  patch: Partial<QuizQuestionDraft>,
): QuizQuestionDraft[] =>
  questions.map((q, i) => (i === index ? { ...q, ...patch } : q));

export const moveQuestion = (
  questions: QuizQuestionDraft[],
  from: number,
  to: number,
): QuizQuestionDraft[] => {
  if (to < 0 || to >= questions.length || from === to) return questions;
  const next = [...questions];
  const [moved] = next.splice(from, 1);
  if (!moved) return questions;
  next.splice(to, 0, moved);
  return next;
};

export const addOption = (
  questions: QuizQuestionDraft[],
  index: number,
): QuizQuestionDraft[] =>
  updateQuestion(questions, index, {
    options: [
      ...(questions[index]?.options ?? []),
      { text: "", isCorrect: false },
    ],
  });

/**
 * Removing an option can orphan the answer: if the one marked correct goes,
 * the question becomes unscoreable. Promote the first survivor rather than
 * leaving a question that validation will reject and an operator will have to
 * hunt for.
 */
export const removeOption = (
  questions: QuizQuestionDraft[],
  index: number,
  optionIndex: number,
): QuizQuestionDraft[] => {
  const question = questions[index];
  if (!question) return questions;

  const options = question.options.filter((_, i) => i !== optionIndex);
  if (options.length > 0 && !options.some((o) => o.isCorrect)) {
    options[0] = { ...options[0]!, isCorrect: true };
  }
  return updateQuestion(questions, index, { options });
};

/** Single-choice: marking one correct unmarks the rest. */
export const setCorrectOption = (
  questions: QuizQuestionDraft[],
  index: number,
  optionIndex: number,
): QuizQuestionDraft[] =>
  updateQuestion(questions, index, {
    options: (questions[index]?.options ?? []).map((o, i) => ({
      ...o,
      isCorrect: i === optionIndex,
    })),
  });

export interface QuizProblem {
  /** Index into the question list, or null for whole-quiz problems. */
  index: number | null;
  message: string;
}

/**
 * Mirrors what QuizService enforces on save. Duplicated on purpose: the API
 * is the authority, and this exists so an operator gets the message next to
 * the offending question instead of a 400 with a code in it.
 */
export function validateQuiz(questions: QuizQuestionDraft[]): QuizProblem[] {
  const problems: QuizProblem[] = [];

  if (questions.length === 0) {
    problems.push({
      index: null,
      message: "Add at least one question — an empty test can't be scored.",
    });
  }

  questions.forEach((question, index) => {
    if (!question.prompt.trim()) {
      problems.push({ index, message: "The question text is required." });
    }
    if (question.options.length < 2) {
      problems.push({
        index,
        message: "A question needs at least two options.",
      });
    }
    if (question.options.some((o) => !o.text.trim())) {
      problems.push({ index, message: "Every option needs text." });
    }

    const correct = question.options.filter((o) => o.isCorrect).length;
    if (correct !== 1) {
      problems.push({
        index,
        // Neither is merely untidy: a question with no right answer denies
        // marks to learners who answered as well as anyone could, and one
        // with two can't be scored as single-choice at all.
        message:
          correct === 0
            ? "Mark exactly one option as the correct answer."
            : "Only one option can be the correct answer.",
      });
    }
  });

  return problems;
}
