import Link from "next/link";

import { Detail, type LegalSection } from "../components/LegalPage";

export const TERMS_INTRO = (
  <p>
    These terms apply when you use Pratikar Digital Hub — browsing, making an
    account, or buying anything on it. By using the site you agree to them. If
    you don&apos;t, please don&apos;t use it.
  </p>
);

export const TERMS_SECTIONS: LegalSection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <p>
        Pratikar Digital Hub is operated by <Detail field="legalName" />,
        registered at <Detail field="address" /> (&quot;we&quot;,
        &quot;us&quot;). You can reach us through the{" "}
        <Link href="/contact">Contact page</Link>.
      </p>
    ),
  },
  {
    id: "not-legal-advice",
    title: "We are not a law firm",
    body: (
      <>
        <p>
          We provide document templates, educational courses and reference
          material. We are not a law firm, and nothing on this site — including
          a generated document, a course, a guide or an answer from the
          assistant — is legal advice about your situation. Using the site does
          not create a lawyer–client relationship.
        </p>
        <p>
          A template is drafted for the common case. Whether it suits yours is
          your decision. If your matter is significant or unusual, speak to a
          lawyer — or add a lawyer&apos;s review to your document before you
          sign it.
        </p>
      </>
    ),
  },
  {
    id: "your-account",
    title: "Your account",
    body: (
      <ul>
        <li>
          You sign in with a one-time code sent to your email or phone, or with
          your Google account. There is no password to keep.
        </li>
        <li>
          Keep access to that email, phone or Google account secure — anyone who
          can receive your codes can use your account.
        </li>
        <li>
          Give accurate details. Your name appears on certificates and your
          details on tax invoices.
        </li>
        <li>You must be at least 18 years old to make an account.</li>
      </ul>
    ),
  },
  {
    id: "what-you-can-buy",
    title: "What you can buy",
    body: (
      <ul>
        <li>
          <strong>Document templates.</strong> You answer a set of questions and
          we generate the document as a Word file and a PDF, which you can
          download once you&apos;ve paid.
        </li>
        <li>
          <strong>Lawyer review.</strong> An optional add-on to a generated
          document: a lawyer reads what you filled in and returns it with any
          notes.
        </li>
        <li>
          <strong>Courses.</strong> Video courses with access for a fixed period
          from the day you enrol, and a certificate when you complete one.
        </li>
        <li>
          <strong>Library items.</strong> E-books, checklists and fill-in forms
          you download and keep.
        </li>
      </ul>
    ),
  },
  {
    id: "prices-and-payment",
    title: "Prices and payment",
    body: (
      <>
        <p>
          Prices are in Indian rupees and shown including GST. Payment is taken
          by Razorpay; we never see or store your card, UPI or bank details. A
          GST invoice is issued for every purchase and kept in your account.
        </p>
        <p>
          Cancellations and refunds are covered by our{" "}
          <Link href="/refunds">Cancellation &amp; Refund Policy</Link>, and how
          each item reaches you by our{" "}
          <Link href="/delivery">Delivery Policy</Link>.
        </p>
      </>
    ),
  },
  {
    id: "using-what-you-buy",
    title: "Using what you buy",
    body: (
      <p>
        You may use what you buy for your own personal or business purposes —
        fill it in, sign it, print it, keep it. You may not resell, republish or
        share our templates, courses or library items, or offer them as part of
        a service of your own.
      </p>
    ),
  },
  {
    id: "courses-and-certificates",
    title: "Courses and certificates",
    body: (
      <ul>
        <li>
          Course access runs for the period shown on the course, starting on the
          day you enrol. Your certificate stays valid after access ends.
        </li>
        <li>
          Each certificate carries a verification code. Anyone with the code can
          check it on this site, and will see your name, the course, the date
          and your score.
        </li>
        <li>
          A certificate records that you completed one of our courses. It is not
          a professional qualification or licence, and must not be presented as
          one.
        </li>
      </ul>
    ),
  },
  {
    id: "assistant",
    title: "The AI assistant",
    body: (
      <p>
        The assistant helps you find material on this site. Its answers are
        generated automatically, can be wrong, and are not legal advice. Check
        anything important against the item itself, or with a lawyer.
      </p>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: (
      <p>
        Don&apos;t misuse the site: no attempts to break or overload it, to copy
        the catalogue in bulk, to get into other people&apos;s accounts, or to
        use a document for anything unlawful. We may suspend an account that
        does.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Our liability",
    body: (
      <p>
        We work to keep the site accurate and available, but we can&apos;t
        promise it will always be either. To the extent the law allows, our
        liability for anything arising from your use of the site is limited to
        the amount you paid us for the item concerned. Nothing here limits a
        liability the law does not allow us to limit.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <p>
        We may update these terms. The date at the top shows when they last
        changed. Changes apply from then on and don&apos;t affect purchases
        already made.
      </p>
    ),
  },
  {
    id: "law",
    title: "Governing law",
    body: (
      <p>
        These terms are governed by the laws of India. The courts at{" "}
        <Detail field="jurisdictionCity" /> have jurisdiction over any dispute
        about them.
      </p>
    ),
  },
  {
    id: "grievances",
    title: "Questions and grievances",
    body: (
      <p>
        Contact our Grievance Officer, <Detail field="grievanceOfficerName" />,
        at <Detail field="grievanceOfficerEmail" />, or see the{" "}
        <Link href="/contact">Contact page</Link> for other ways to reach us.
      </p>
    ),
  },
];
