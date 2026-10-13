import type {
  ContentLibraryItem,
  ContentType,
  Course,
  Template,
} from "@pratikar/types";
import type { Metadata } from "next";

import {
  Assurances,
  Audiences,
  CatalogueTabs,
  ClosingBanner,
  FaqTeaser,
  FeatureRows,
  HowItWorks,
  ImpactBand,
  LandingHero,
  PlatformOverview,
  summariseCatalogue,
  TopicExplorer,
  TrustMarquee,
  type FaqPreviewItem,
  type Shelf,
} from "@/features/home";
import { COURSES_LIVE } from "@/shared/lib/features";
import {
  CONTENT_CATEGORY_LABELS,
  CONTENT_KIND,
  templateCategoryLabel,
} from "@/shared/lib/labels";
import { shelfHref } from "@/shared/lib/navigation";
import { dataOf, serverGet } from "@/shared/lib/serverApi";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/** How many FAQ answers the home page previews. */
const FAQ_PREVIEW = 5;
/** How many cards each catalogue tab carries. */
const SHELF_SIZE = 8;

/** The catalogue tabs, shaped on the server so the client gets only cards. */
function buildShelves({
  templates,
  courses,
  library,
}: {
  templates: Template[];
  courses: Course[];
  library: ContentLibraryItem[];
}): Shelf[] {
  const libraryShelf = (type: ContentType, id: string, label: string) => ({
    id,
    label,
    href: shelfHref(type),
    total: library.filter((item) => item.type === type).length,
    items: library
      .filter((item) => item.type === type)
      .slice(0, SHELF_SIZE)
      .map((item) => ({
        id: item.id,
        href: `/content-library/${item.id}`,
        kind: CONTENT_KIND[item.type],
        title: item.title,
        meta: [CONTENT_CATEGORY_LABELS[item.category]],
        priceInPaise: item.priceInPaise,
      })),
  });

  return [
    {
      id: "templates",
      label: "Templates",
      href: "/documents",
      total: templates.length,
      items: templates.slice(0, SHELF_SIZE).map((template) => ({
        id: template.id,
        href: `/documents/${template.id}`,
        kind: "document" as const,
        title: template.title,
        meta: [
          templateCategoryLabel(template.category),
          `${template.fieldSchema.length} questions`,
        ],
        priceInPaise: template.priceInPaise,
      })),
    },
    libraryShelf("FORM", "forms", "Legal forms"),
    libraryShelf("CHECKLIST", "checklists", "Checklists"),
    libraryShelf("EBOOK", "ebooks", "E-books"),
    {
      id: "courses",
      label: "Courses",
      href: "/courses",
      total: courses.length,
      items: courses.slice(0, SHELF_SIZE).map((course) => ({
        id: course.id,
        href: `/courses/${course.id}`,
        kind: "course" as const,
        title: course.title,
        meta: [`${course.accessDurationDays} days' access`, "Certificate"],
        priceInPaise: course.priceInPaise,
      })),
    },
  ];
}

/**
 * The landing page, in the order a first-time visitor's questions come:
 * what is this (hero, and what it's built on), what's in it (the platform),
 * show me (the catalogue), how does each part work (feature rows), is it
 * for me (audiences), by topic, why trust it, how it works, quick answers,
 * and a last nudge.
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
  const catalogue = {
    templates: dataOf(templates) ?? [],
    // Not counted or listed while courses are coming soon.
    courses: COURSES_LIVE ? (dataOf(courses) ?? []) : [],
    library: dataOf(library) ?? [],
  };
  const summary = summariseCatalogue(catalogue);
  const faqItems = (dataOf(faq) ?? [])
    .flatMap((group) => group.items)
    .slice(0, FAQ_PREVIEW);

  return (
    <>
      <LandingHero summary={summary} />
      <TrustMarquee summary={summary} />
      <PlatformOverview summary={summary} />
      <CatalogueTabs shelves={buildShelves(catalogue)} />
      <FeatureRows />
      <Audiences />
      <TopicExplorer summary={summary} />
      <ImpactBand summary={summary} />
      <HowItWorks />
      <Assurances />
      <FaqTeaser items={faqItems} />
      <ClosingBanner />
    </>
  );
}
