/**
 * One description of the site's shape, shared by the header, the mobile
 * drawer, the Explore menu and the home page. Adding a section in one place
 * and forgetting the other three is how navigation quietly goes stale.
 */

export interface NavLink {
  href: string;
  label: string;
  /** One line, used wherever there's room to say what a section actually is. */
  hint: string;
}

export interface NavGroup {
  label: string;
  href: string;
  links: NavLink[];
}

/**
 * The Explore panel. Grouped by what someone is trying to do rather than by
 * how the product is built — nobody arrives wanting "the content library",
 * they arrive wanting to know what a rent agreement needs.
 */
export const EXPLORE: NavGroup[] = [
  {
    label: "Documents",
    href: "/documents",
    links: [
      {
        href: "/documents?category=rental",
        label: "Rent & property",
        hint: "Rent agreements, notices, sale deeds",
      },
      {
        href: "/documents?category=employment",
        label: "Employment",
        hint: "Offer letters, contracts, NDAs",
      },
      {
        href: "/documents?category=business",
        label: "Business",
        hint: "Partnership deeds, vendor agreements",
      },
      {
        href: "/documents",
        label: "All templates",
        hint: "Everything we can generate",
      },
    ],
  },
  {
    label: "Learn",
    href: "/courses",
    links: [
      {
        href: "/courses",
        label: "Certificate courses",
        hint: "Video courses with a verifiable certificate",
      },
      {
        href: "/content-library?category=BUSINESS_COMPLIANCE",
        label: "Business compliance",
        hint: "GST, registrations, filings",
      },
      {
        href: "/content-library?category=PROPERTY_DOCUMENTATION",
        label: "Property documentation",
        hint: "What to check before you sign",
      },
      {
        href: "/content-library?category=DIGITAL_CAREER",
        label: "Digital career",
        hint: "Working online, legally",
      },
    ],
  },
  {
    label: "Resources",
    href: "/content-library",
    links: [
      {
        href: "/content-library?category=CHECKLISTS_REFERENCE",
        label: "Checklists",
        hint: "Step-by-step reference sheets",
      },
      {
        href: "/content-library",
        label: "E-book library",
        hint: "Long-form guides to buy and keep",
      },
      {
        href: "/verify",
        label: "Verify a certificate",
        hint: "Check a certificate code — no account needed",
      },
      {
        href: "/assistant",
        label: "AI legal assistant",
        hint: "Ask a question in plain language",
      },
    ],
  },
];

/** The flat list the mobile drawer and the footer use. */
export const PRIMARY_NAV: NavLink[] = [
  { href: "/documents", label: "Documents", hint: "Generate from a template" },
  { href: "/courses", label: "Courses", hint: "Learn and get certified" },
  {
    href: "/content-library",
    label: "Library",
    hint: "E-books and checklists",
  },
  { href: "/verify", label: "Verify", hint: "Check a certificate code" },
];
