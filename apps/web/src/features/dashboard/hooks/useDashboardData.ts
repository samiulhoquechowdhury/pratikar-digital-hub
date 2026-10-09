"use client";

import type { CustomerOrder, Enrollment } from "@pratikar/types";
import { useCallback, useEffect, useState } from "react";

import {
  documentsApi,
  type MyDocument,
} from "@/features/documents/api/documentsApi";
import { lmsApi } from "@/features/lms/api/lmsApi";
import { paymentsApi } from "@/features/payments/api/paymentsApi";
import { useAuth } from "@/shared/providers/AuthProvider";

export type { MyDocument };

export interface DashboardData {
  documents: MyDocument[];
  enrollments: Enrollment[];
  orders: CustomerOrder[];
}

/**
 * Loads the whole account in one go.
 *
 * Each of the three panels used to fetch for itself, which meant three
 * requests, three loading states and three skeletons resolving at different
 * moments — so the page visibly reassembled itself for a second after every
 * visit. One request settles the lot, and the page renders once.
 *
 * Loading them together also makes a summary possible at all: counting what
 * needs attention requires all three, and no single panel could see that far.
 */
export function useDashboardData() {
  const { user, isRestoring } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setData(null);
      setIsLoading(false);
      return;
    }
    setError(null);
    try {
      // Parallel, not sequential: they're independent, and three round trips
      // in series is the difference between a fast dashboard and a slow one.
      const [documents, enrollments, orders] = await Promise.all([
        documentsApi.listMine(),
        lmsApi.listMyEnrollments(),
        paymentsApi.listMine(),
      ]);
      setData({ documents, enrollments, orders });
    } catch {
      setError("Couldn't load your account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Wait for the refresh cookie to be checked before deciding there is no
    // user — otherwise a reload briefly shows the signed-out state to someone
    // who is signed in.
    if (isRestoring) return;
    void load();
  }, [isRestoring, load]);

  return { data, isLoading: isLoading || isRestoring, error, reload: load };
}
