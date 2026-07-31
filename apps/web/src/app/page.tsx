import Link from "next/link";

const PRODUCTS = [
  {
    href: "/documents",
    title: "Document templates",
    description:
      "Answer a few questions and get a ready-to-sign document. Add a lawyer review if you want a second pair of eyes.",
    cta: "Browse templates",
  },
  {
    href: "/content-library",
    title: "Content library",
    description:
      "E-books and checklists on compliance, property paperwork, and running a business in India.",
    cta: "Browse the library",
  },
  {
    href: "/courses",
    title: "Courses",
    description:
      "Video courses with a verifiable certificate on completion. Six months' access from enrolment.",
    cta: "See courses",
  },
];

const STEPS = [
  {
    title: "Pick a template",
    body: "Choose from templates covering rent, employment, business, and property.",
  },
  {
    title: "Fill in the form",
    body: "Plain-language questions, no legal drafting required. Your answers stay private.",
  },
  {
    title: "Pay and download",
    body: "Get your document as a Word file and a PDF, ready to print and sign.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-shell px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand">
              For individuals and small businesses
            </p>
            <h1 className="mt-3 text-4xl sm:text-5xl">
              Legal paperwork, without the guesswork.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-ink-muted">
              Generate documents from vetted templates, read up on the rules
              that apply to you, and take courses that come with a certificate
              you can prove.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/documents"
                className="rounded-control bg-brand px-5 py-3 text-sm font-semibold text-ink-on-brand transition-colors hover:bg-brand-hover"
              >
                Create a document
              </Link>
              <Link
                href="/courses"
                className="rounded-control border border-line-strong bg-surface px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-surface-sunken"
              >
                Explore courses
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-shell px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl">What you can do here</h2>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCTS.map((product) => (
            <li
              key={product.href}
              className="flex flex-col rounded-card border border-line bg-surface p-6 shadow-card transition-shadow hover:shadow-raised"
            >
              <h3 className="text-lg">{product.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
                {product.description}
              </p>
              <Link
                href={product.href}
                className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:text-brand-hover"
              >
                {product.cta}
                <span aria-hidden>→</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-shell px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-2xl">How a document works</h2>
          <ol className="mt-8 grid gap-8 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <span
                  aria-hidden
                  className="grid h-9 w-9 place-items-center rounded-full bg-brand-subtle text-sm font-semibold text-brand"
                >
                  {index + 1}
                </span>
                <h3 className="mt-4 text-base">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-shell px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-card border border-line bg-surface p-8 shadow-card sm:flex sm:items-center sm:justify-between sm:gap-8">
          <div>
            <h2 className="text-xl">Checking someone&apos;s certificate?</h2>
            <p className="mt-2 text-sm text-ink-muted">
              Enter the code printed on it to confirm we issued it. No account
              needed.
            </p>
          </div>
          <Link
            href="/verify"
            className="mt-5 inline-block shrink-0 rounded-control border border-line-strong bg-surface px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-surface-sunken sm:mt-0"
          >
            Verify a certificate
          </Link>
        </div>
      </section>
    </>
  );
}
