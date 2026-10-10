import type { ContentLibraryItem, Course, Template } from "@pratikar/types";
import type { Metadata } from "next";

import {
  AssistantBanner,
  Assurances,
  CategoryBrowser,
  ClosingBanner,
  CourseShelf,
  CoursesBanner,
  DraftingShowcase,
  FaqTeaser,
  HowItWorks,
  LandingHero,
  LibraryShelf,
  Offerings,
  summariseCatalogue,
  TemplateShelf,
  type FaqPreviewItem,
} from "@/features/home";
import { COURSES_LIVE } from "@/shared/lib/features";
import { dataOf, serverGet } from "@/shared/lib/serverApi";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/** How many FAQ answers the home page previews. */
const FAQ_PREVIEW = 5;

/**
 * The landing page, in the order a first-time visitor's questions come:
 * what is this (hero), what's in it (offerings), the thing nobody else does
 * (AI drafting with an advocate), what's in it by topic, show me (shelves),
 * what if I don't know what I need (assistant), how it works, why trust
 * it, quick answers, and a last nudge.
 *
 * The catalogue is read on the server so counts and titles are in the HTML
 * — for search engines, and so the page never opens on placeholders. If
 * the API is unreachable, sections that need it leave themselves out.
 */
export default async function HomePage() {
  const [templates, courses, library, faq] = await Promise.all([
    serverGet<Template[]>("/documents/templates"),
    serverGet<Course[]>("/courses"),
    serverGet<ContentLibraryItem[]>("/content-library"),
    serverGet<{ category: string; items: FaqPreviewItem[] }[]>("/faq"),
  ]);
  const summary = summariseCatalogue({
    templates: dataOf(templates),
    // Not counted or listed while courses are coming soon.
    courses: COURSES_LIVE ? dataOf(courses) : [],
    library: dataOf(library),
  });
  const faqItems = (dataOf(faq) ?? [])
    .flatMap((group) => group.items)
    .slice(0, FAQ_PREVIEW);

  return (
    <>
      <LandingHero summary={summary} />
      <Offerings summary={summary} />
      <DraftingShowcase />
      <CategoryBrowser summary={summary} />
      <TemplateShelf />
      <LibraryShelf />
      <AssistantBanner />
      <HowItWorks />
      <CoursesBanner />
      {COURSES_LIVE && <CourseShelf />}
      <Assurances />
      <FaqTeaser items={faqItems} />
      <ClosingBanner />
    </>
  );
}
