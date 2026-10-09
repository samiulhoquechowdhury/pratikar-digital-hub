/**
 * Switches for parts of the site that exist in code but aren't ready to sell.
 *
 * Read at build time (NEXT_PUBLIC_), so flipping one is a redeploy, not a
 * code change.
 */

/**
 * Courses are built — catalogue, enrolment, quizzes, certificates — but the
 * video player waits on Cloudflare Stream. Until it's switched on, every
 * course page says "coming soon" and nothing course-related can be bought.
 * Anyone already enrolled keeps their courses under My courses.
 */
export const COURSES_LIVE = process.env.NEXT_PUBLIC_COURSES_LIVE === "true";
