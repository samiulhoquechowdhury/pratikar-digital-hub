import Link from "next/link";

import { Detail, type LegalSection } from "../components/LegalPage";

export const PRIVACY_INTRO = (
  <p>
    This explains what personal data Pratikar Digital Hub collects, why, who
    else handles it, and the rights you have over it under India&apos;s Digital
    Personal Data Protection Act, 2023. We collect what the service needs to
    work, and nothing to sell or to advertise with.
  </p>
);

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    id: "who-is-responsible",
    title: "Who is responsible for your data",
    body: (
      <p>
        <Detail field="legalName" />, <Detail field="address" />, decides how
        your data is used and is responsible for it.
      </p>
    ),
  },
  {
    id: "what-we-collect",
    title: "What we collect",
    body: (
      <ul>
        <li>
          <strong>Account details:</strong> your email address or phone number,
          and your name. If you sign in with Google, we receive your name and
          email address from Google.
        </li>
        <li>
          <strong>What you enter into a document:</strong> the answers you give
          when generating one. These can include other people&apos;s details — a
          landlord&apos;s or an employee&apos;s name and address — so only enter
          what the document needs.
        </li>
        <li>
          <strong>Purchases:</strong> what you bought, when, and for how much,
          and the invoices and credit notes issued for them. Card, UPI and bank
          details go to Razorpay, not to us.
        </li>
        <li>
          <strong>Courses:</strong> which lessons you&apos;ve completed, your
          test answers and scores, and any certificate issued.
        </li>
        <li>
          <strong>Questions to the assistant:</strong> what you type into it.
        </li>
        <li>
          <strong>Technical data:</strong> your IP address and browser details,
          used to keep your session secure and to limit abuse.
        </li>
      </ul>
    ),
  },
  {
    id: "why",
    title: "Why we use it",
    body: (
      <ul>
        <li>
          To provide what you buy: generating documents, running courses,
          issuing certificates, delivering downloads.
        </li>
        <li>To take payments and issue the tax invoices the law requires.</li>
        <li>
          To send the emails the service needs — sign-in codes, purchase
          confirmations, review and refund notices.
        </li>
        <li>To keep the site and your account secure and prevent fraud.</li>
      </ul>
    ),
  },
  {
    id: "sharing",
    title: "Who else handles your data",
    body: (
      <>
        <p>
          We don&apos;t sell your data or use it for advertising. It is handled
          by these providers, only to do their part of the service:
        </p>
        <ul>
          <li>
            <strong>Razorpay</strong> — takes payments.
          </li>
          <li>
            <strong>Resend</strong> — delivers our emails, including sign-in
            codes.
          </li>
          <li>
            <strong>Cloudflare</strong> — stores generated documents, invoices
            and library files.
          </li>
          <li>
            <strong>Our hosting provider</strong> — runs the site and its
            database.
          </li>
          <li>
            <strong>Google</strong> — if you choose to sign in with Google.
          </li>
          <li>
            <strong>Anthropic and Voyage AI</strong> — process the questions you
            ask the assistant, to produce an answer.
          </li>
          <li>
            <strong>Sentry</strong> — receives reports of errors on the site, so
            we can fix them. Reports carry the error and the page it happened
            on, not what you typed or your account details.
          </li>
          <li>
            <strong>Reviewing lawyers</strong> — see a document and your answers
            only when you buy a lawyer review of it.
          </li>
        </ul>
        <p>
          Some of these providers process data outside India. We also share data
          where the law requires it — for example, with tax authorities or under
          a court order.
        </p>
        <p>
          <strong>Certificates are public by design:</strong> anyone with a
          certificate&apos;s code can see the holder&apos;s name, the course,
          the date and the score, so that the certificate can be checked.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies",
    body: (
      <p>
        We use one cookie, to keep you signed in. It is essential to the service
        and is not used to track you. We don&apos;t use advertising or analytics
        cookies. If you use &quot;Continue with Google&quot;, Google&apos;s own
        sign-in script runs on the page under Google&apos;s privacy policy.
      </p>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <p>
        We keep your account data while your account is open. Invoices and
        payment records are kept for as long as tax law requires, even if you
        close your account. Questions you ask the assistant are kept for 90
        days, so we can see what people look for and add what is missing, then
        deleted. Other data is deleted or anonymised when it is no longer needed
        for the purpose it was collected for.
      </p>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    body: (
      <>
        <p>Under the Digital Personal Data Protection Act, 2023, you can:</p>
        <ul>
          <li>ask for a summary of the personal data we hold about you;</li>
          <li>have it corrected or completed;</li>
          <li>have it erased, except where the law requires us to keep it;</li>
          <li>withdraw consent you have given;</li>
          <li>
            nominate someone to exercise these rights for you if you can&apos;t;
            and
          </li>
          <li>
            raise a grievance with us, and then with the Data Protection Board
            of India.
          </li>
        </ul>
        <p>
          You can download a copy of your data, or delete your account, at any
          time from Account settings. For anything else, write to our Grievance
          Officer (below).
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "Security",
    body: (
      <p>
        Data is sent over encrypted connections. Sign-in uses one-time codes,
        and your session is kept in a cookie scripts on the page can&apos;t
        read. Staff access to customer data is limited by role, and changes made
        by staff are logged.
      </p>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        The site is for people aged 18 and over. We don&apos;t knowingly collect
        data from children.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        We&apos;ll update this policy when what we collect or who handles it
        changes. The date at the top shows the last change.
      </p>
    ),
  },
  {
    id: "grievance-officer",
    title: "Grievance Officer",
    body: (
      <p>
        <Detail field="grievanceOfficerName" />
        <br />
        <Detail field="grievanceOfficerEmail" />
        <br />
        <Detail field="address" />
        <br />
        Other ways to reach us are on the{" "}
        <Link href="/contact">Contact page</Link>.
      </p>
    ),
  },
];
