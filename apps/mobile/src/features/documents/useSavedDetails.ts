import type { Template } from "@pratikar/types";
import { useEffect, useState } from "react";

import { api } from "@/lib/api";

import type { FilledData } from "./DynamicForm";
import { documentsApi } from "./documentsApi";
import {
  answersFromPrevious,
  prefillFromProfile,
  type CustomerProfile,
} from "./prefill";

export interface SavedDetails {
  loaded: boolean;
  fromProfile: FilledData;
  previous: { answers: FilledData; createdAt: string } | null;
}

/**
 * What the customer has already told us for this template — the website's
 * useSavedDetails. Either lookup failing just leaves that part empty.
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
      api.get<CustomerProfile>("/users/me").catch(() => null),
      documentsApi.listMine().catch(() => []),
    ]).then(([profile, documents]) => {
      if (cancelled) return;
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
