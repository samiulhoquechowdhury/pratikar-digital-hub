/**
 * Switches for parts of the app that exist in code but aren't ready to sell —
 * the website's features.ts. Baked in at build time (EXPO_PUBLIC_), so
 * flipping one is a new build.
 *
 * Courses wait on Cloudflare Stream for their videos. Until they're on,
 * /courses shows what's being prepared, and nothing course-related can be
 * bought; anyone already enrolled keeps their courses under My courses.
 */
export const COURSES_LIVE = process.env.EXPO_PUBLIC_COURSES_LIVE === "true";
