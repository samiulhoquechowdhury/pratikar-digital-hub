import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/shared/lib/site";

/**
 * Indexing is opt-in, per deployment. Staging and preview deployments run
 * the same code; if they were indexable, search engines would list a second
 * copy of the site — test data and all — competing with the real one. Only
 * the production deployment sets ALLOW_SEARCH_INDEXING=true.
 */
export default function robots(): MetadataRoute.Robots {
  if (process.env.ALLOW_SEARCH_INDEXING !== "true") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private or endless: accounts, lessons, sign-in, and search results
      // (every query is a new URL). Certificate pages under /verify/ stay
      // crawlable on purpose — they carry their own noindex, which a crawler
      // can only read if it's allowed in.
      disallow: ["/dashboard", "/learn/", "/login", "/signup", "/search"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
