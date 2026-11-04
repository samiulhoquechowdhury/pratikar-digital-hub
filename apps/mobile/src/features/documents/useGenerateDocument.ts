import type { GeneratedDocument } from "@pratikar/types";
import { useState } from "react";

import type { FilledData } from "./DynamicForm";
import { describeAnswerProblems } from "./answerProblems";
import { documentsApi } from "./documentsApi";

/** The website's useGenerateDocument: generate, and go back to edit the answers. */
export function useGenerateDocument(templateId: string) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedDocument | null>(null);
  const [answers, setAnswers] = useState<FilledData | null>(null);

  const generate = async (filledData: FilledData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      setResult(await documentsApi.generate({ templateId, filledData }));
      setAnswers(filledData);
    } catch (err) {
      // The server re-checks every answer and says which it refused, and why.
      setError(
        describeAnswerProblems(err) ??
          "Couldn't generate the document. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    generate,
    isSubmitting,
    error,
    result,
    answers,
    edit: () => setResult(null),
  };
}
