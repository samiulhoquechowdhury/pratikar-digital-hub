/**
 * The scripted answers behind the assistant preview.
 *
 * ── THIS IS A DEMO, AND IT HAS TO KEEP SAYING SO ──────────────────────────
 * There is no model here. Milestone 4 builds the real thing — retrieval over
 * the templates, courses and guides — and until then every reply comes from
 * this file by keyword match. The UI labels itself a preview throughout,
 * because on a legal-services site a chat that looks like it works and
 * doesn't is worse than no chat at all.
 *
 * Two rules the scripted answers keep, which the real one will inherit:
 *
 *   Point at material, never advise. "Here is the template and what it
 *   covers" is in scope; "you should evict them" is not, and no amount of
 *   hedging makes it in scope on a site that sells legal documents.
 *
 *   Only link to things that exist. Every href below is a real route with
 *   real content behind it, so the demo is genuinely useful to click through
 *   rather than a set of dead ends.
 */

export interface DemoLink {
  href: string;
  label: string;
}

export interface DemoAnswer {
  /** Markdown-free plain paragraphs; the UI renders each as its own <p>. */
  paragraphs: string[];
  links?: DemoLink[];
}

interface ScriptEntry extends DemoAnswer {
  id: string;
  /** Shown as a starter chip. Phrased the way someone would actually ask. */
  question: string;
  /** Lower-case terms; a question matching enough of them selects this entry. */
  keywords: string[];
}

export const DEMO_SCRIPT: ScriptEntry[] = [
  {
    id: "rent-arrears",
    question: "My tenant hasn't paid rent for three months",
    keywords: [
      "tenant",
      "rent",
      "arrears",
      "paid",
      "landlord",
      "notice",
      "evict",
    ],
    paragraphs: [
      "That usually starts with a written notice to the tenant recording what is owed and by when it must be paid. Keeping it in writing matters later, because a verbal demand is hard to evidence.",
      "Our Rent Agreement template covers the payment terms, notice period and security deposit for a new or replacement tenancy. For an existing dispute, a lawyer review of your current agreement is usually the faster answer — the notice period you actually have is whatever that document says.",
    ],
    links: [
      { href: "/documents", label: "Rent Agreement template" },
      { href: "/content-library", label: "Guides and checklists" },
    ],
  },
  {
    id: "gst-register",
    question: "Do I need to register for GST as a freelancer?",
    keywords: [
      "gst",
      "register",
      "registration",
      "freelancer",
      "turnover",
      "threshold",
    ],
    paragraphs: [
      "For services, registration generally becomes compulsory once turnover crosses ₹20 lakh in a financial year — lower in some special-category states. There are also cases where it applies regardless of turnover, such as supplying across state lines or through certain platforms.",
      "The GST for Freelancers course walks through registration, the returns you then have to file, and the deadlines. The GST Filing Checklist is the short version if you only want the dates.",
    ],
    links: [
      { href: "/courses", label: "GST for Freelancers course" },
      { href: "/content-library", label: "GST Filing Checklist" },
    ],
  },
  {
    id: "offer-letter",
    question: "I'm hiring my first employee — what do I need?",
    keywords: [
      "hire",
      "hiring",
      "employee",
      "offer",
      "letter",
      "employment",
      "contract",
      "staff",
    ],
    paragraphs: [
      "An offer letter is the usual starting point: role, salary, start date, probation, notice period and confidentiality. It is what the employee accepts in writing before they join.",
      "Our Employment Offer Letter template asks for those details and produces the document. If the role involves sensitive information or you want the terms checked, you can add a lawyer review to any document you generate.",
    ],
    links: [{ href: "/documents", label: "Employment Offer Letter template" }],
  },
  {
    id: "certificate-verify",
    question: "How does someone verify my course certificate?",
    keywords: [
      "certificate",
      "verify",
      "verification",
      "employer",
      "qr",
      "genuine",
      "authentic",
    ],
    paragraphs: [
      "Every certificate carries a unique code and a QR pointing at our public verification page. Anyone can open it — no account needed — and it shows the holder's name, the course and the date it was issued.",
      "You earn one by completing every lesson and its test, with an average of at least 80% across them. Retakes are unlimited and your best score counts.",
    ],
    links: [
      { href: "/verify", label: "Verify a certificate" },
      { href: "/courses", label: "Browse courses" },
    ],
  },
  {
    id: "document-cost",
    question: "What does a document cost, and can I edit it after?",
    keywords: [
      "cost",
      "price",
      "pricing",
      "pay",
      "edit",
      "download",
      "how much",
      "refund",
    ],
    paragraphs: [
      "Each template is priced on its own page, and GST is added at checkout — the total you see before paying is the total. A lawyer review is a separate, optional charge on top.",
      "You fill in the form, preview the result, and pay only when you are happy with it. After payment the document is yours to download from your account.",
    ],
    links: [
      { href: "/documents", label: "Browse templates" },
      { href: "/dashboard", label: "Your documents" },
    ],
  },
  {
    id: "lawyer-review",
    question: "What does the lawyer review actually include?",
    keywords: [
      "lawyer",
      "review",
      "advocate",
      "check",
      "professional",
      "expert",
    ],
    paragraphs: [
      "A reviewer reads the document you generated against what you told us it is for, and comes back with corrections and comments. It is a check on the specific document, not open-ended advice about your situation.",
      "You can add it to any document at the point of purchase, or afterwards from your account.",
    ],
    links: [{ href: "/documents", label: "Browse templates" }],
  },
];

/** The chips offered before the first message. */
export const STARTER_QUESTIONS = DEMO_SCRIPT.map((e) => ({
  id: e.id,
  question: e.question,
}));

/**
 * Anything the script has no entry for.
 *
 * Deliberately does not improvise. A wrong answer about a notice period or a
 * tax threshold is worse than no answer, and a preview that bluffs would be
 * demoed to customers as though it were the finished assistant.
 */
export const FALLBACK: DemoAnswer = {
  paragraphs: [
    "I can't answer that one yet — this preview only has a handful of scripted replies, and I'd rather say so than guess at something on a legal site.",
    "The full assistant will search the templates, courses and guides on this site and show you where each answer came from. In the meantime, try one of the suggested questions, or search the site directly.",
  ],
  links: [{ href: "/search", label: "Search the site" }],
};

/** Words too common to signal anything; ignored when scoring a question. */
const STOP_WORDS = new Set([
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "how",
  "does",
  "did",
  "do",
  "is",
  "are",
  "was",
  "the",
  "a",
  "an",
  "i",
  "my",
  "me",
  "for",
  "to",
  "of",
  "and",
  "or",
  "in",
  "on",
  "it",
  "can",
  "need",
  "have",
  "has",
  "with",
  "you",
]);

/**
 * Picks the scripted answer whose keywords the question hits hardest.
 *
 * Substring matching on purpose — "registration" should match the keyword
 * "register", and "employees" should match "employee". Requiring two hits
 * before claiming a match keeps a single incidental word, like "cost"
 * appearing in an unrelated sentence, from selecting a confidently wrong
 * answer; a single hit only wins if it is a distinctive term.
 */
export function answerFor(question: string): DemoAnswer {
  const words = question
    .toLowerCase()
    .split(/[^a-z0-9₹]+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));

  let best: ScriptEntry | null = null;
  let bestScore = 0;

  for (const entry of DEMO_SCRIPT) {
    const score = entry.keywords.filter((k) =>
      words.some((w) => w.includes(k) || k.includes(w)),
    ).length;
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }

  if (!best || bestScore < 2) return FALLBACK;
  return { paragraphs: best.paragraphs, links: best.links };
}

/** Exact lookup for the starter chips, which must never fall back. */
export function answerById(id: string): DemoAnswer {
  const entry = DEMO_SCRIPT.find((e) => e.id === id);
  return entry
    ? { paragraphs: entry.paragraphs, links: entry.links }
    : FALLBACK;
}
