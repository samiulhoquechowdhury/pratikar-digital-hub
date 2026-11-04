import type { Href } from "expo-router";
import * as WebBrowser from "expo-web-browser";

import { siteUrl } from "./config";

/**
 * The API speaks in website paths — a chat source's href, a notification's
 * link. This maps each to the app screen that shows the same thing, or
 * null for a page that only exists on the website.
 */
export function appRouteFor(path: string): Href | null {
  const [pathname = "", query = ""] = path.split("?");
  const params = Object.fromEntries(new URLSearchParams(query));
  const parts = pathname.split("/").filter(Boolean);
  const [section, id, ...rest] = parts;

  switch (section) {
    case undefined:
      return "/";
    case "documents":
      if (id === "custom") return { pathname: "/documents/custom", params };
      return id
        ? { pathname: "/documents/[id]", params: { ...params, id } }
        : "/documents";
    case "content-library":
      return id
        ? { pathname: "/library/[id]", params: { id } }
        : { pathname: "/library", params };
    case "courses":
      return id ? { pathname: "/courses/[id]", params: { id } } : "/courses";
    case "dashboard":
      if (id === "documents" && rest[0])
        return { pathname: "/account/documents/[id]", params: { id: rest[0] } };
      if (id === "documents") return "/account/documents";
      if (id === "orders") return "/account/orders";
      if (id === "library") return "/account/library";
      if (id === "courses") return "/account/courses";
      if (id === "settings") return "/account/settings";
      return "/account";
    case "learn":
      return id
        ? { pathname: "/learn/[enrollmentId]", params: { enrollmentId: id } }
        : "/account/courses";
    case "faq":
      return "/faq";
    case "assistant":
      return "/assistant";
    case "verify":
      return id ? { pathname: "/verify", params: { code: id } } : "/verify";
    default:
      return null;
  }
}

/** Opens a website path in the app when it can, in the browser otherwise. */
export function openSitePath(path: string, push: (href: Href) => void): void {
  const route = appRouteFor(path);
  if (route) push(route);
  else void WebBrowser.openBrowserAsync(siteUrl(path));
}
