import type { Course } from "@pratikar/types";
import { Badge } from "@pratikar/ui";
import { formatPaise } from "@pratikar/utils";
import Link from "next/link";

/**
 * One course, as it appears in every grid on the site — the catalogue, the
 * home page, and search results. Shared so a change to how a course is
 * presented doesn't have to be made three times and get made twice.
 *
 * There is no rating or enrolment count here on purpose. Those are the numbers
 * that carry a course card on Coursera and Udemy, but this catalogue has
 * neither yet, and inventing them on a site selling legal material would be
 * the wrong first impression to make.
 */
export function CourseCard({ course }: { course: Course }) {
  const moduleCount = course.modules?.length;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card transition-shadow hover:shadow-raised">
      {/* Stand-in for cover art: courses have no image field yet, and a grid of
          identical grey placeholders looks more unfinished than a coloured
          band does. */}
      <div aria-hidden className="flex h-24 items-end bg-hero-navy px-5 pb-3">
        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-brand">
          Certificate course
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-semibold">
          {/* Only the title is the link: it keeps the accessible name short,
              and the card's hover shadow still signals the target. Note the
              hover colour is navy, not gold — gold text on white is 2.10:1. */}
          <Link
            href={`/courses/${course.id}`}
            className="text-ink transition-colors group-hover:text-primary"
          >
            {course.title}
          </Link>
        </h3>

        {course.description && (
          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-ink-muted">
            {course.description}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {moduleCount !== undefined && moduleCount > 0 && (
            <Badge>{moduleCount} modules</Badge>
          )}
          <Badge>{course.accessDurationDays} days&apos; access</Badge>
        </div>

        <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
          <span className="text-lg font-semibold text-ink">
            {formatPaise(course.priceInPaise)}
          </span>
          <span className="text-xs font-medium text-ink-subtle">
            Certificate included
          </span>
        </div>
      </div>
    </article>
  );
}
