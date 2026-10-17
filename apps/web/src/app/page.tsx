import type {
  ContentLibraryItem,
  ContentType,
  Course,
  Template,
} from "@pratikar/types";
import { grossPaise } from "@pratikar/utils";
import type { Metadata } from "next";

import {
  AreasOfLaw,
  AssistantFeature,
  Audiences,
  CatalogueTabs,
  ClosingCall,
  CoursesFeature,
  FaqTeaser,
  LandingHero,
  PracticeIndex,
  PriceGuide,
  Process,
  SignatureDrafting,
  summariseCatalogue,
  TheStandard,
  TitleMarquee,
  type FaqPreviewItem,
  type PriceFloor,
  type Shelf,
} from "@/features/home";
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

/**
 * The landing page, in the order a first-time visitor's questions come:
 * what is this (hero, and the advocate-written library it stands on),
 * everything it does (the practice), the one thing nobody else does (AI
 * drafting with an advocate), show me (the catalogue), by area of law,
 * what if I don't know what I need (the assistant), is it for me, courses,
 * what it costs, why trust it, how it works, quick answers — and a last
 * invitation. Sections are numbered so the long page reads as one document.
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
      <TitleMarquee summary={summary} />
      <PracticeIndex summary={summary} />
      <SignatureDrafting />
      <CatalogueTabs shelves={buildShelves(catalogue)} />
      <AreasOfLaw summary={summary} />
      <AssistantFeature />
      <Audiences />
      <CoursesFeature />
      <PriceGuide prices={buildPrices(catalogue)} />
      <TheStandard />
      <Process />
      <FaqTeaser items={faqItems} />
      <ClosingCall />
    </>
  );
}
