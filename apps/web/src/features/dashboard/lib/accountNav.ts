import {
  BookOpen,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Receipt,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface AccountNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** The account's pages, in sidebar order. */
export const ACCOUNT_NAV: AccountNavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/documents", label: "My documents", icon: FileText },
  { href: "/dashboard/courses", label: "My courses", icon: GraduationCap },
  { href: "/dashboard/library", label: "My library", icon: BookOpen },
  { href: "/dashboard/orders", label: "Orders & invoices", icon: Receipt },
  { href: "/dashboard/settings", label: "Account settings", icon: Settings },
];

/**
 * Whether a nav item is the page being shown. The dashboard itself matches
 * only exactly — every account page starts with /dashboard.
 */
export const isActive = (href: string, pathname: string) =>
  href === "/dashboard"
    ? pathname === "/dashboard"
    : pathname === href || pathname.startsWith(`${href}/`);

/**
 * The account used to be one page with tabs, addressed as /dashboard#courses
 * and so on — and those links are in emails customers already have. Each old
 * hash maps to the page that now holds that list.
 */
const LEGACY_HASHES: Record<string, string> = {
  documents: "/dashboard/documents",
  courses: "/dashboard/courses",
  purchases: "/dashboard/orders",
};

export const legacyHashTarget = (hash: string): string | null =>
  LEGACY_HASHES[hash.replace(/^#/, "")] ?? null;
