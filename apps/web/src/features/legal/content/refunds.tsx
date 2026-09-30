import Link from "next/link";

import { Detail, type LegalSection } from "../components/LegalPage";

export const REFUNDS_INTRO = (
  <p>
    Everything on Pratikar Digital Hub is digital and delivered straight away,
    so when a refund is possible depends on whether you&apos;ve already received
    what you paid for. Here is how it works for each kind of item.
  </p>
);

export const REFUND_SECTIONS: LegalSection[] = [
  {
    id: "documents",
    title: "Document templates",
    body: (
      <ul>
        <li>
          Generating a document and seeing its preview is free. You only pay
          once you&apos;ve seen it, so check the preview before paying.
        </li>
        <li>
          If you&apos;ve paid but not yet downloaded the document, you can ask
          for a full refund within 7 days of payment.
        </li>
        <li>
          Each document can be downloaded once, so once it has been downloaded
          it can&apos;t be refunded — unless the file itself is faulty, in which
          case we&apos;ll fix it or refund you.
        </li>
      </ul>
    ),
  },
  {
    id: "lawyer-review",
    title: "Lawyer review",
    body: (
      <ul>
        <li>
          You can cancel a lawyer review for a full refund until a lawyer has
          started on it.
        </li>
        <li>
          Once a lawyer has started, or has returned the document, the review
          can&apos;t be refunded.
        </li>
      </ul>
    ),
  },
  {
    id: "courses",
    title: "Courses",
    body: (
      <ul>
        <li>
          You can ask for a full refund within 7 days of enrolling, as long as
          you haven&apos;t completed any lessons or received a certificate.
        </li>
        <li>After that, course fees aren&apos;t refundable.</li>
      </ul>
    ),
  },
  {
    id: "library",
    title: "E-books, checklists and forms",
    body: (
      <p>
        These can be downloaded as soon as you buy them, so they aren&apos;t
        refundable once purchased — except where the file is faulty or not as
        described, which we&apos;ll put right or refund.
      </p>
    ),
  },
  {
    id: "payment-problems",
    title: "Failed and duplicate payments",
    body: (
      <p>
        If money left your account but the purchase didn&apos;t go through, or
        you were charged twice for the same item, we refund the extra payment in
        full. Most failed payments are reversed automatically by the bank; if
        yours isn&apos;t, contact us with the payment details.
      </p>
    ),
  },
  {
    id: "how-refunds-work",
    title: "How a refund works",
    body: (
      <ul>
        <li>
          Refunds go back to the payment method you used, through Razorpay.
          Banks usually take 5–7 working days to show it.
        </li>
        <li>
          A GST credit note is issued for every refund and kept in your account.
        </li>
        <li>
          Access to what was refunded ends: the document can&apos;t be
          downloaded, the course closes, and a pending review is cancelled.
        </li>
      </ul>
    ),
  },
  {
    id: "asking",
    title: "How to ask for a refund",
    body: (
      <p>
        Email <Detail field="supportEmail" /> from the address on your account,
        with the order you&apos;d like refunded. You&apos;ll find your orders
        under <Link href="/dashboard#purchases">Purchases</Link> in your
        account.
      </p>
    ),
  },
];
