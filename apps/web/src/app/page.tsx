import type { ContentLibraryItem, Course, Template } from "@pratikar/types";
import type { Metadata } from "next";

import {
  AssistantBanner,
  Assurances,
  CategoryBrowser,
  ClosingBanner,
  CourseShelf,
  CoursesBanner,
  HowItWorks,
  LandingHero,
  LibraryShelf,
  Offerings,
  summariseCatalogue,
  TemplateShelf,
} from "@/features/home";
import { COURSES_LIVE } from "@/shared/lib/features";
import { dataOf, serverGet } from "@/shared/lib/serverApi";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/**
 * The landing page, in the order a first-time visitor's questions come:
 * what is this (hero), what's in it (offerings, topics), what if I don't
 * know what I need (assistant), show me (shelves), how does it work, and
 * why trust it.
 *
 * The catalogue is read on the server so the counts and titles are in the
 * HTML — for search engines, and so the page never opens on a row of
 * placeholders. If the API is unreachable, the sections that need it leave
 * themselves out rather than show a zero.
 */
export default async function HomePage() {
  const [templates, courses, library] = await Promise.all([
    serverGet<Template[]>("/documents/templates"),
    serverGet<Course[]>("/courses"),
    serverGet<ContentLibraryItem[]>("/content-library"),
  ]);
  const summary = summariseCatalogue({
    templates: dataOf(templates),
    // Not counted or listed while courses are coming soon.
    courses: COURSES_LIVE ? dataOf(courses) : [],
    library: dataOf(library),
  });

  return (
    <>
      <LandingHero summary={summary} />
      <Offerings summary={summary} />
      <CategoryBrowser summary={summary} />
      <AssistantBanner />
      <TemplateShelf />
      <LibraryShelf />
      <CoursesBanner />
      {COURSES_LIVE && <CourseShelf />}
      <HowItWorks />
      <Assurances />
      <ClosingBanner />
    </>
  );
}
