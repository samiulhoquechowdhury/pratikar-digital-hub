import {
  ArrowRight,
  Building2,
  Mail,
  Phone,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Icon } from "@/shared/components/Icon";
import { PageIntro, PageSection } from "@/shared/components/PageIntro";
import { companyDetails } from "@/shared/lib/company";

import { Detail, DraftNotice } from "./LegalPage";

function ContactCard({
  icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-card border border-line p-6">
      <span className="grid h-10 w-10 place-items-center rounded-control bg-primary-subtle text-primary">
        <Icon icon={icon} size="md" />
      </span>
      <h2 className="mt-5 text-base font-semibold">{title}</h2>
      <div className="mt-2 space-y-1 text-base leading-relaxed text-ink-muted">
        {children}
      </div>
    </div>
  );
}

/** A mailto/tel link once the detail exists; the placeholder until then. */
function Reach({
  field,
  scheme,
}: {
  field: "supportEmail" | "supportPhone" | "grievanceOfficerEmail";
  scheme: "mailto" | "tel";
}) {
  const value = companyDetails()[field].trim();
  if (!value) return <Detail field={field} />;
  return (
    <a
      href={`${scheme}:${value.replace(/\s/g, "")}`}
      className="font-medium text-primary underline-offset-2 hover:underline"
    >
      {value}
    </a>
  );
}

/** Answers people usually came to the Contact page for, one click away. */
const SHORTCUTS = [
  { href: "/refunds", label: "Asking for a refund" },
  { href: "/delivery", label: "A purchase hasn't arrived" },
  { href: "/verify", label: "Checking a certificate" },
  { href: "/dashboard#purchases", label: "Finding an invoice" },
];

export function ContactPage() {
  return (
    <>
      <PageIntro
        eyebrow="Contact"
        title="Get in touch"
        description="Questions about an order, a document or a course — write to us and we'll help. Include your order details if it's about a purchase."
      />
      <PageSection className="pb-8">
        <DraftNotice />

        <div className="grid gap-5 md:grid-cols-2">
          <ContactCard icon={Mail} title="Email support">
            <p>
              <Reach field="supportEmail" scheme="mailto" />
            </p>
            <p className="text-sm">
              Best for orders and refunds — write from the address on your
              account so we can find your purchases.
            </p>
          </ContactCard>

          <ContactCard icon={Phone} title="Phone">
            <p>
              <Reach field="supportPhone" scheme="tel" />
            </p>
          </ContactCard>

          <ContactCard icon={Building2} title="Registered office">
            <p className="font-medium text-ink">
              <Detail field="legalName" />
            </p>
            <p>
              <Detail field="address" />
            </p>
            <p className="text-sm">
              GSTIN: <Detail field="gstin" />
            </p>
          </ContactCard>

          <ContactCard icon={ShieldCheck} title="Grievance Officer">
            <p className="font-medium text-ink">
              <Detail field="grievanceOfficerName" />
            </p>
            <p>
              <Reach field="grievanceOfficerEmail" scheme="mailto" />
            </p>
            <p className="text-sm">
              For complaints about the service or about your personal data,
              under the IT Rules, 2021 and the DPDP Act, 2023.
            </p>
          </ContactCard>
        </div>

        <section className="mt-12">
          <h2 className="text-lg font-semibold">
            You might find it faster here
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SHORTCUTS.map((shortcut) => (
              <li key={shortcut.href}>
                <Link
                  href={shortcut.href}
                  className="group flex h-full items-center justify-between gap-3 rounded-card border border-line px-4 py-3 text-sm font-medium text-ink transition-colors hover:border-line-strong hover:bg-surface-sunken"
                >
                  {shortcut.label}
                  <Icon
                    icon={ArrowRight}
                    className="text-ink-subtle transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </PageSection>
    </>
  );
}
