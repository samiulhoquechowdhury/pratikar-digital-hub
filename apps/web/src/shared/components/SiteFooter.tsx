import Link from "next/link";

/**
 * Server component — no interactivity, and the legal links here are exactly
 * the sort of thing that should be in the initial HTML.
 */
export function SiteFooter() {
  return (
    <footer className="mt-16 bg-surface-inverse-deep">
      <div className="mx-auto max-w-shell px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="max-w-sm">
            <p className="text-base font-bold tracking-wide text-ink-inverse">
              PRATIKAR DIGITAL HUB
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-brand">
              Legal knowledge in every home
            </p>
            <p className="mt-3 text-sm text-ink-inverse-muted">
              Legal document templates, reference material, and courses for
              individuals and small businesses in India.
            </p>
          </div>

          <nav aria-label="Footer" className="flex gap-12">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-brand">
                Products
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link
                    href="/documents"
                    className="text-ink-inverse-muted hover:text-ink-inverse"
                  >
                    Documents
                  </Link>
                </li>
                <li>
                  <Link
                    href="/content-library"
                    className="text-ink-inverse-muted hover:text-ink-inverse"
                  >
                    Library
                  </Link>
                </li>
                <li>
                  <Link
                    href="/courses"
                    className="text-ink-inverse-muted hover:text-ink-inverse"
                  >
                    Courses
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-brand">
                Support
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link
                    href="/verify"
                    className="text-ink-inverse-muted hover:text-ink-inverse"
                  >
                    Verify a certificate
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="text-ink-inverse-muted hover:text-ink-inverse"
                  >
                    My account
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        {/*
          Not legal advice — this needs to be visible on a product that sells
          legal document templates, and belongs in the footer of every page
          rather than buried on one. Final wording is the client's lawyer's
          call, not ours.
        */}
        <div className="mt-10 border-t border-line-inverse pt-6">
          <p className="max-w-prose text-xs leading-relaxed text-ink-inverse-muted">
            Pratikar Digital Hub provides document templates and educational
            material. It is not a law firm and does not provide legal advice.
            Using this service does not create a solicitor–client relationship.
          </p>
          <p className="mt-3 text-xs text-ink-inverse-muted">
            © {new Date().getFullYear()} Pratikar Digital Hub. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
