/**
 * Strips an error report down to what's needed to fix the bug, before it
 * leaves for the monitoring service.
 *
 * What this product handles makes the default reports unsafe to send as-is:
 *
 *   request bodies    one-time sign-in codes; the answers someone typed into
 *                     a legal document — names, addresses, salaries
 *   cookies, headers  the refresh-token cookie and bearer tokens: enough to
 *                     sign in as the customer
 *   query strings     signed download links carry their token in the URL
 *
 * So all of it goes, and only the method, the path and the stack trace are
 * kept. That is almost always enough to find the bug; when it isn't, the
 * logs on the server are the place to look, not a third party's dashboard.
 *
 * TWIN: apps/web/src/shared/lib/monitoring/scrub.ts holds the same rule for
 * the website. They are copies because this app ships compiled JavaScript and
 * can't consume a source-only shared package; change one, change both — each
 * has the same spec.
 */

interface ReportRequest {
  url?: string;
  method?: string;
  data?: unknown;
  cookies?: unknown;
  headers?: Record<string, string>;
  query_string?: unknown;
  env?: unknown;
}

interface ReportBreadcrumb {
  data?: Record<string, unknown>;
}

export interface Report {
  request?: ReportRequest;
  user?: { id?: unknown };
  breadcrumbs?: ReportBreadcrumb[];
}

/** "https://x/api/download?token=abc#top" -> "https://x/api/download". */
export const withoutQuery = (url: string): string => url.split(/[?#]/)[0]!;

export function scrubReport<T extends Report>(report: T): T {
  if (report.request) {
    const { url, method } = report.request;
    report.request = {
      ...(url ? { url: withoutQuery(url) } : {}),
      ...(method ? { method } : {}),
    };
  }

  // Only an id, if anything: enough to find the account in our own records,
  // nothing that identifies the person to anyone else.
  if (report.user) {
    report.user = report.user.id ? { id: report.user.id } : {};
  }

  // Breadcrumbs record earlier requests on the same page, URLs and all.
  report.breadcrumbs = report.breadcrumbs?.map((crumb) => {
    if (!crumb.data) return crumb;
    const data = { ...crumb.data };
    for (const key of ["url", "to", "from"]) {
      if (typeof data[key] === "string") data[key] = withoutQuery(data[key]);
    }
    return { ...crumb, data };
  });

  return report;
}
