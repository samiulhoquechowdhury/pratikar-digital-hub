import Link from "next/link";

/**
 * Server component — no interactivity, and the legal links here are exactly
 * the sort of thing that should be in the initial HTML.
 */
export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto max-w-shell px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="max-w-sm">
            <p className="text-base font-semibold text-ink">
              Pratikar Digital Hub
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              Legal document templates, reference material, and courses for
              individuals and small businesses in India.
            </p>
          </div>

          <nav aria-label="Footer" className="flex gap-12">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                Products
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link
                    href="/documents"
                    className="text-ink-muted hover:text-ink"
                  >
                    Documents
                  </Link>
                </li>
                <li>
                  <Link
                    href="/content-library"
                    className="text-ink-muted hover:text-ink"
                  >
                    Library
                  </Link>
                </li>
                <li>
                  <Link
                    href="/courses"
                    className="text-ink-muted hover:text-ink"
                  >
                    Courses
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                Support
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link
                    href="/verify"
                    className="text-ink-muted hover:text-ink"
                  >
                    Verify a certificate
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="text-ink-muted hover:text-ink"
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
        <div className="mt-8 border-t border-line pt-6">
          <p className="text-xs leading-relaxed text-ink-subtle">
            Pratikar Digital Hub provides document templates and educational
            material. It is not a law firm and does not provide legal advice.
            Using this service does not create a solicitor–client relationship.
          </p>
          <p className="mt-3 text-xs text-ink-subtle">
            © {new Date().getFullYear()} Pratikar Digital Hub. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
