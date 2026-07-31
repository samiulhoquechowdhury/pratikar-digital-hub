"use client";

import type { GeneratedDocument } from "@pratikar/types";
import { useState } from "react";

import { documentsApi } from "../api/documentsApi";
import type { FilledData } from "../components/DynamicTemplateForm";

export function useGenerateDocument(templateId: string) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedDocument | null>(null);

  const generate = async (filledData: FilledData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const document = await documentsApi.generate({ templateId, filledData });
      setResult(document);
    } catch {
      setError("Couldn't generate the document. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return { generate, isSubmitting, error, result };
}
