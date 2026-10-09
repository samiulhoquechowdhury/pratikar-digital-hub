"use client";

import type { GeneratedDocument } from "@pratikar/types";
import { useState } from "react";

import { documentsApi } from "../api/documentsApi";
import type { FilledData } from "../components/DynamicTemplateForm";
import { describeAnswerProblems } from "../lib/answerProblems";

export function useGenerateDocument(templateId: string) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedDocument | null>(null);
  // The answers behind the current result, so "Edit answers" can reopen the
  // form exactly as it was submitted.
  const [answers, setAnswers] = useState<FilledData | null>(null);

  const generate = async (filledData: FilledData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const document = await documentsApi.generate({ templateId, filledData });
      setResult(document);
      setAnswers(filledData);
    } catch (err) {
      // The server checks every answer again and says which it refused and
      // why; that beats a generic failure for someone with a long form.
      setError(
        describeAnswerProblems(err) ??
          "Couldn't generate the document. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Back to the form, keeping the answers; the next generate makes a new document. */
  const edit = () => setResult(null);

  return { generate, isSubmitting, error, result, answers, edit };
}
