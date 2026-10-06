"use client";

import type { Template } from "@pratikar/types";
import { useEffect, useState } from "react";

import { apiClient } from "@/shared/lib/apiClient";

import { documentsApi } from "../api/documentsApi";
import type { FilledData } from "../components/DynamicTemplateForm";
import {
  answersFromPrevious,
  prefillFromProfile,
  type CustomerProfile,
} from "../lib/prefill";

export interface SavedDetails {
  /** False until both lookups have answered (or failed). */
  loaded: boolean;
  /** This template's fields filled from the customer's profile. */
  fromProfile: FilledData;
  /** The customer's most recent document of this template, if any. */
  previous: { answers: FilledData; createdAt: string } | null;
}

/**
 * What the customer has already told us, for this template: their profile
 * details in the fields staff marked as theirs, and the answers from the
 * last time they made this document.
 *
 * Either lookup failing just leaves that part empty — the form works
 * without them, and a customer shouldn't see an error for a convenience.
 */
export function useSavedDetails(template: Template): SavedDetails {
  const [details, setDetails] = useState<SavedDetails>({
    loaded: false,
    fromProfile: {},
    previous: null,
  });

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      apiClient.get<CustomerProfile>("/users/me").catch(() => null),
      documentsApi.listMine().catch(() => []),
    ]).then(([profile, documents]) => {
      if (cancelled) return;
      // Newest first, as the API returns them.
      const last = documents.find((d) => d.templateId === template.id);
      const answers = last
        ? answersFromPrevious(template.fieldSchema, last.filledData)
        : {};
      setDetails({
        loaded: true,
        fromProfile: profile
          ? prefillFromProfile(template.fieldSchema, profile)
          : {},
        previous:
          last && Object.keys(answers).length > 0
            ? { answers, createdAt: last.createdAt }
            : null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [template]);

  return details;
}
