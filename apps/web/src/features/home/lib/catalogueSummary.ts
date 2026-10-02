import {
  CONTENT_CATEGORIES,
  type ContentCategory,
  type ContentLibraryItem,
  type ContentType,
  type Course,
  type Template,
} from "@pratikar/types";

/** How many example titles each offering and category shows. */
const EXAMPLES = 3;

export interface Offering {
  count: number;
  examples: string[];
}

export interface CategorySummary {
  category: ContentCategory;
  count: number;
  examples: string[];
}

export interface CatalogueSummary {
  templates: Offering;
  courses: Offering;
  library: Record<ContentType, Offering>;
  categories: CategorySummary[];
  /** Everything for sale — the one number the hero states. */
  total: number;
}

const offering = (titles: string[]): Offering => ({
  count: titles.length,
  examples: titles.slice(0, EXAMPLES),
});

/**
 * What the catalogue holds, counted from the catalogue itself.
 *
 * The landing page quotes these numbers, so they come from the rows that are
 * actually on sale, never from a figure typed into the page: a "500+ forms"
 * that the library doesn't back up is the first thing a sceptical visitor
 * would check. A kind the API couldn't return is simply counted as empty,
 * and the page leaves out what it can't vouch for.
 */
export function summariseCatalogue({
  templates = [],
  courses = [],
  library = [],
}: {
  templates?: Template[];
  courses?: Course[];
  library?: ContentLibraryItem[];
}): CatalogueSummary {
  const ofType = (type: ContentType) =>
    offering(library.filter((i) => i.type === type).map((i) => i.title));

  const categories = CONTENT_CATEGORIES.map((category) => {
    const inCategory = library.filter((i) => i.category === category);
    return {
      category,
      count: inCategory.length,
      examples: inCategory.slice(0, EXAMPLES).map((i) => i.title),
    };
  }).filter((summary) => summary.count > 0);

  return {
    templates: offering(templates.map((t) => t.title)),
    courses: offering(courses.map((c) => c.title)),
    library: {
      FORM: ofType("FORM"),
      CHECKLIST: ofType("CHECKLIST"),
      EBOOK: ofType("EBOOK"),
    },
    categories,
    total: templates.length + courses.length + library.length,
  };
}

/**
 * A count as the page says it: exact when small, rounded down to a tidy
 * "300+" when large, so the number stays true as items are added or retired.
 */
export function countLabel(count: number): string {
  if (count < 20) return String(count);
  const step = count < 100 ? 10 : count < 1000 ? 50 : 100;
  return `${Math.floor(count / step) * step}+`;
}
