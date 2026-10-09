import Link from "next/link";

import { Detail, type LegalSection } from "../components/LegalPage";

export const DELIVERY_INTRO = (
  <p>
    Nothing we sell is shipped. Every item is digital and reaches you through
    your account, usually within moments of payment. Here is when and how each
    one arrives.
  </p>
);

export const DELIVERY_SECTIONS: LegalSection[] = [
  {
    id: "documents",
    title: "Document templates",
    body: (
      <ul>
        <li>
          The document is generated from your answers within a minute or two.
          Generating is free.
        </li>
        <li>
          Once paid, it is ready to download as a Word file and a PDF from the
          document&apos;s page and from{" "}
          <Link href="/dashboard/documents">My documents</Link>.
        </li>
        <li>
          Each document can be downloaded once, so save the files somewhere safe
          when you do.
        </li>
      </ul>
    ),
  },
  {
    id: "lawyer-review",
    title: "Lawyer review",
    body: (
      <p>
        The reviewed document is returned to your account, with any notes from
        the lawyer, and we email you when it&apos;s ready.
      </p>
    ),
  },
  {
    id: "courses",
    title: "Courses",
    body: (
      <p>
        Access starts as soon as payment is confirmed and runs for the period
        shown on the course. Find your courses under{" "}
        <Link href="/dashboard/courses">My courses</Link>. Your certificate is
        issued in your account when you complete the course.
      </p>
    ),
  },
  {
    id: "library",
    title: "E-books, checklists and forms",
    body: (
      <p>
        Available to download from the item&apos;s page as soon as payment is
        confirmed, as many times as you need.
      </p>
    ),
  },
  {
    id: "invoices",
    title: "Invoices",
    body: (
      <p>
        A GST invoice is issued with every purchase and can be downloaded from{" "}
        <Link href="/dashboard/orders">Orders &amp; invoices</Link> in your
        account.
      </p>
    ),
  },
  {
    id: "not-arrived",
    title: "If something hasn't arrived",
    body: (
      <p>
        Payment confirmation usually takes a few seconds, occasionally a little
        longer. If a purchase still isn&apos;t in your account after a few
        minutes, email <Detail field="supportEmail" /> with your payment details
        and we&apos;ll sort it out.
      </p>
    ),
  },
];
