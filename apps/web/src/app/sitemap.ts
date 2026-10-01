import type { ContentLibraryItem, Course, Template } from "@pratikar/types";
import type { MetadataRoute } from "next";

import { dataOf, serverGet } from "@/shared/lib/serverApi";
import { absoluteUrl } from "@/shared/lib/site";

/** Rebuilt at most every hour; new products appear without a deploy. */
export const revalidate = 3600;

/** Public pages that aren't products. */
const STATIC_PATHS = [
  "/",
  "/documents",
  "/courses",
  "/content-library",
  "/verify",
  "/assistant",
  "/terms",
  "/privacy",
  "/refunds",
  "/delivery",
  "/contact",
];

/**
 * Every page a search engine should know about: the fixed ones and every
 * published product. If the API can't be reached while this is built, the
 * product entries are simply missing until the next rebuild — the fixed
 * pages still go out, rather than an error.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [templates, courses, items] = await Promise.all([
    serverGet<Template[]>("/documents/templates"),
    serverGet<Course[]>("/courses"),
    serverGet<ContentLibraryItem[]>("/content-library"),
  ]);

  const product = (path: string, createdAt: string) => ({
    url: absoluteUrl(path),
    lastModified: new Date(createdAt),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  });

  return [
    ...STATIC_PATHS.map((path) => ({
      url: absoluteUrl(path),
      changeFrequency: "weekly" as const,
      priority: path === "/" ? 1 : 0.6,
    })),
    ...(dataOf(templates) ?? []).map((t) =>
      product(`/documents/${t.id}`, t.createdAt),
    ),
    ...(dataOf(courses) ?? []).map((c) =>
      product(`/courses/${c.id}`, c.createdAt),
    ),
    ...(dataOf(items) ?? []).map((i) =>
      product(`/content-library/${i.id}`, i.createdAt),
    ),
  ];
}
