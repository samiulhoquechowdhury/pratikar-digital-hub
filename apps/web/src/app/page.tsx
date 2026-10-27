import type {
  ContentLibraryItem,
  ContentType,
  Course,
  Template,
} from "@pratikar/types";
import { grossPaise } from "@pratikar/utils";
import type { Metadata } from "next";

import {
  AreaStrip,
  Audiences,
  CatalogueTabs,
  ClosingBanner,
  DraftingPromo,
  ExploreChips,
  FaqTeaser,
  LandingHero,
  PriceGuide,
  Process,
  QuickStart,
  summariseCatalogue,
  TrendingNow,
  WhyPratikar,
  type FaqPreviewItem,
  type PriceFloor,
  type Shelf,
  type TrendingColumn,
} from "@/features/home";
import {
  COURSE_AREAS,
  PLANNED_COURSES,
  type CourseArea,
} from "@/shared/catalogue/certificateCourses";
import { COURSES_LIVE } from "@/shared/lib/features";
import { formatPrice } from "@/shared/lib/format";
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

/**
 * The certificate courses being prepared, one tab per area — each card
 * points at the course's entry on /courses, since none can be bought yet.
 */
function buildCourseShelves(): Shelf[] {
  return (Object.keys(COURSE_AREAS) as CourseArea[]).map((area) => {
    const courses = PLANNED_COURSES.filter((course) => course.area === area);
    return {
      id: `courses-${area}`,
      label: COURSE_AREAS[area],
      href: `/courses#${area}`,
      total: courses.length,
      items: courses.map((course) => ({
        id: course.slug,
        href: `/courses#${course.slug}`,
        kind: "course" as const,
        title: course.title,
        meta: [course.duration, `${course.modules} modules`],
        priceInPaise: null,
      })),
    };
  });
}

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
 * The lowest real price of each kind, GST included — for the fees section.
 * A kind with nothing on sale is left out rather than given a number.
 */
function buildPrices({
  templates,
  courses,
  library,
}: {
  templates: Template[];
  courses: Course[];
  library: ContentLibraryItem[];
}): PriceFloor[] {
  const floor = (prices: number[]) =>
    prices.length > 0 ? formatPrice(grossPaise(Math.min(...prices))) : null;
  const ofType = (type: ContentType) =>
    library.filter((item) => item.type === type).map((i) => i.priceInPaise);

  const rows: (PriceFloor | null)[] = [
    (() => {
      const from = floor(ofType("FORM"));
      return from
        ? {
            label: "Legal forms",
            from,
            note: "Ready to fill in and file — download once, keep forever.",
            href: shelfHref("FORM"),
          }
        : null;
    })(),
    (() => {
      const from = floor([...ofType("CHECKLIST"), ...ofType("EBOOK")]);
      return from
        ? {
            label: "Checklists & e-books",
            from,
            note: "Plain-language guides to what to check, and why.",
            href: "/content-library",
          }
        : null;
    })(),
    (() => {
      const from = floor(templates.map((t) => t.priceInPaise));
      return from
        ? {
            label: "Ready templates",
            from,
            note: "Your answers in; a finished Word and PDF out. Preview free.",
            href: "/documents",
          }
        : null;
    })(),
    (() => {
      const from = floor(courses.map((c) => c.priceInPaise));
      return from
        ? {
            label: "Courses",
            from,
            note: "Video lessons ending in a certificate anyone can verify.",
            href: "/courses",
          }
        : null;
    })(),
  ];
  return rows.filter((row): row is PriceFloor => row !== null);
}

/** How many items each "Trending now" column lists. */
const TRENDING_SIZE = 4;

/**
 * Coursera's "Trending now" columns, from the real catalogue: a few of each
 * kind. There's no view count to rank by yet, so these are the first of
 * each shelf rather than a claim about popularity.
 */
function buildTrending({
  templates,
  library,
}: {
  templates: Template[];
  library: ContentLibraryItem[];
}): TrendingColumn[] {
  const shelf = (type: ContentType, title: string): TrendingColumn => ({
    title,
    href: shelfHref(type),
    items: library
      .filter((item) => item.type === type)
      .slice(0, TRENDING_SIZE)
      .map((item) => ({
        id: item.id,
        href: `/content-library/${item.id}`,
        kind: CONTENT_KIND[item.type],
        title: item.title,
        meta: CONTENT_CATEGORY_LABELS[item.category],
      })),
  });
  return [
    {
      title: "Ready templates",
      href: "/documents",
      items: templates.slice(0, TRENDING_SIZE).map((template) => ({
        id: template.id,
        href: `/documents/${template.id}`,
        kind: "document" as const,
        title: template.title,
        meta: `${template.fieldSchema.length} questions`,
      })),
    },
    shelf("FORM", "Legal forms"),
    shelf("CHECKLIST", "Checklists"),
    shelf("EBOOK", "E-books"),
  ];
}

/**
 * The landing page, in the order a first-time visitor's questions come:
 * the banners (what's new and what's here), three ways to begin, new and
 * popular, the flagship promoted, the library by area of law, trending now,
 * popular searches, why trust it, who it's for, prices, how it works,
 * quick answers — and a last nudge. Coursera's home page, section for
 * section, filled with this catalogue.
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
      <QuickStart />
      <CatalogueTabs shelves={buildShelves(catalogue)} />
      {/* Live courses join the tabs above; until then, what's coming. */}
      {!COURSES_LIVE && (
        <CatalogueTabs
          shelves={buildCourseShelves()}
          title="Certificate courses"
          description="Practical courses on law, business and careers — each ends in a certificate anyone can verify."
          tabsLabel="Course areas"
          viewAllLabel="View all courses"
        />
      )}
      <DraftingPromo />
      <AreaStrip summary={summary} />
      <TrendingNow columns={buildTrending(catalogue)} />
      <ExploreChips />
      <WhyPratikar />
      <Audiences />
      <PriceGuide prices={buildPrices(catalogue)} />
      <Process />
      <FaqTeaser items={faqItems} />
      <ClosingBanner />
    </>
  );
}
