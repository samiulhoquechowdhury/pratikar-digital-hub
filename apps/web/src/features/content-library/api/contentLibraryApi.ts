import type { ContentLibraryItem } from "@pratikar/types";

import { apiClient } from "@/shared/lib/apiClient";

// Wrappers around apps/api/src/modules/content-library (docs/srs.md Section 3.3).
export const contentLibraryApi = {
  list: (category?: string) =>
    apiClient.get<ContentLibraryItem[]>(
      category
        ? `/content-library?category=${encodeURIComponent(category)}`
        : "/content-library",
    ),

  // Note "catalogue/" — plain /content-library/:id is the admin route and
  // returns the storage key, which customers must not receive.
  get: (id: string) =>
    apiClient.get<ContentLibraryItem>(`/content-library/catalogue/${id}`),

  /**
   * Exchanges a purchase for a short-lived signed download URL. Fails with
   * NOT_PURCHASED if there's no PAID order, so this doubles as the check for
   * whether to show a download button or a buy button.
   */
  /**
   * The free excerpt: links to the item's first pages as watermarked
   * images. `ready` is false while they're being made.
   */
  preview: (id: string) =>
    apiClient.get<{ ready: boolean; pages: string[] }>(
      `/content-library/catalogue/${id}/preview`,
    ),

  download: (id: string) =>
    apiClient.post<{ fileUrl: string; title: string }>(
      `/content-library/${id}/download`,
    ),
};
