import { Role } from "@pratikar/types";

export interface AdminSection {
  href: string;
  label: string;
  /** Under the label in the sidebar. */
  hint: string;
  /** On the home page's card. */
  body: string;
  roles: readonly Role[];
}

const CONTENT = [Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN] as const;
const CUSTOMER_CARE = [Role.SUPPORT, Role.ADMIN, Role.SUPER_ADMIN] as const;

/**
 * Every admin section and who may use it — the sidebar, the home page's
 * cards and each page's own gate all read this one list, so they can't
 * disagree. It mirrors the @Roles on the API routes each section calls; it
 * is presentation only, and the API re-checks every request.
 */
export const SECTIONS: readonly AdminSection[] = [
  {
    href: "/templates",
    label: "Templates",
    hint: "Document templates",
    body: "Create and edit document templates, including the field schema customers fill in.",
    roles: CONTENT,
  },
  {
    href: "/content-library",
    label: "Content library",
    hint: "E-books, checklists",
    body: "Publish e-books, checklists and forms, and set their prices.",
    roles: CONTENT,
  },
  {
    href: "/courses",
    label: "Courses",
    hint: "Courses and modules",
    body: "Manage courses, lessons and tests, and see enrolments and completions.",
    roles: CONTENT,
  },
  {
    href: "/reviews",
    label: "Review queue",
    hint: "Documents awaiting review",
    body: "Claim documents awaiting an advocate's review and return them.",
    roles: CONTENT,
  },
  {
    href: "/faq",
    label: "FAQ",
    hint: "Questions and answers",
    body: "The questions on the site's FAQ page, which the assistant answers from too.",
    roles: CONTENT,
  },
  {
    href: "/assistant",
    label: "Assistant",
    hint: "Insights and search index",
    body: "What customers ask the AI assistant, and its catalogue search index.",
    roles: CONTENT,
  },
  {
    href: "/orders",
    label: "Orders",
    hint: "Payments and refunds",
    body: "Every order placed, with refunds for Admins and above.",
    roles: CUSTOMER_CARE,
  },
  {
    href: "/users",
    label: "Users",
    hint: "Accounts and roles",
    body: "Customer and staff accounts; role changes for Super Admins.",
    roles: CUSTOMER_CARE,
  },
  {
    href: "/settings",
    label: "Settings",
    hint: "Certificates, pricing",
    body: "The certificate's wording and signatory, and system settings for Super Admins.",
    roles: CONTENT,
  },
  {
    href: "/launch",
    label: "Launch checklist",
    hint: "Is the site ready?",
    body: "Every service and setting the live site needs, checked for real.",
    roles: [Role.ADMIN, Role.SUPER_ADMIN],
  },
];

/** The sections this role may use, in sidebar order. */
export const sectionsFor = (role: Role | undefined): AdminSection[] =>
  role ? SECTIONS.filter((section) => section.roles.includes(role)) : [];

/** The section a path belongs to — /courses/abc is in /courses. */
export const sectionOf = (pathname: string): AdminSection | undefined =>
  SECTIONS.find(
    (section) =>
      pathname === section.href || pathname.startsWith(`${section.href}/`),
  );

/** Whether this role may open this path. Pages outside any section are open to all staff. */
export const mayOpen = (role: Role | undefined, pathname: string): boolean => {
  const section = sectionOf(pathname);
  return !section || (role !== undefined && section.roles.includes(role));
};
