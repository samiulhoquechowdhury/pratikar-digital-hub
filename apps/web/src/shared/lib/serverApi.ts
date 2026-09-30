/**
 * Reads from the API while a page renders on the server — for the public
 * catalogue only, so there is never a session to carry.
 *
 * The distinction the result draws matters to the caller:
 *
 *   ok          render with the data
 *   missing     the API said 404 — the page should be a real 404 too, so a
 *               search engine drops the URL instead of indexing an error
 *   unavailable the API couldn't be reached or failed — render the page
 *               without data and let the browser try again, rather than
 *               telling a crawler the product doesn't exist
 */
export type ServerResult<T> =
  { status: "ok"; data: T } | { status: "missing" } | { status: "unavailable" };

/**
 * Inside a deployment the API may be reachable on a private address that the
 * browser can't use; locally both are the same.
 */
const API_BASE =
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

/**
 * How long a rendered catalogue page is reused. Short, because a price change
 * should reach the page quickly — checkout always charges the server's
 * current price regardless, so a stale page can mislead but not overcharge.
 */
export const CATALOGUE_REVALIDATE_SECONDS = 60;

export async function serverGet<T>(path: string): Promise<ServerResult<T>> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      next: { revalidate: CATALOGUE_REVALIDATE_SECONDS },
    });
    if (res.status === 404) return { status: "missing" };
    if (!res.ok) return { status: "unavailable" };
    return { status: "ok", data: (await res.json()) as T };
  } catch {
    return { status: "unavailable" };
  }
}

/** The data, or undefined — for callers that only want it when present. */
export const dataOf = <T>(result: ServerResult<T>): T | undefined =>
  result.status === "ok" ? result.data : undefined;
