# Legal pages — review checklist

The site has five legal and contact pages: `/terms`, `/privacy`, `/refunds`,
`/delivery` and `/contact`. They are written from how the product works today,
but they are **drafts**: until the details below are filled in, every page
shows a "Draft — pending legal review" banner and highlights what is missing.

Razorpay's activation review checks for all five, linked from every page
(they are in the site footer). Complete this list before applying.

## 1. Details to fill in

Set these in `apps/web/.env` (see `apps/web/.env.example`). They are printed
on the public pages, so none of them is secret.

| Setting                               | What it is                                                       |
| ------------------------------------- | ---------------------------------------------------------------- |
| `NEXT_PUBLIC_COMPANY_LEGAL_NAME`      | Registered company name                                          |
| `NEXT_PUBLIC_COMPANY_ADDRESS`         | Registered office address                                        |
| `NEXT_PUBLIC_COMPANY_GSTIN`           | GSTIN (also set `COMPANY_GSTIN` in `apps/api/.env` for invoices) |
| `NEXT_PUBLIC_SUPPORT_EMAIL`           | Where customers write about orders and refunds                   |
| `NEXT_PUBLIC_SUPPORT_PHONE`           | Support phone number                                             |
| `NEXT_PUBLIC_GRIEVANCE_OFFICER_NAME`  | Grievance Officer (IT Rules, 2021; DPDP Act, 2023)               |
| `NEXT_PUBLIC_GRIEVANCE_OFFICER_EMAIL` | Grievance Officer's email                                        |
| `NEXT_PUBLIC_JURISDICTION_CITY`       | City whose courts the Terms name                                 |
| `NEXT_PUBLIC_POLICIES_UPDATED_ON`     | The date the lawyer signs the pages off                          |

## 2. Decisions the draft makes — confirm or change

Each of these is a business or legal choice written into the draft so the
page reads as a complete policy. None of them is enforced by code except
where noted.

**Refunds (`/refunds`)**

- [ ] Documents: full refund if paid for but **not yet downloaded**, within
      **7 days** of payment. After download, only for a faulty file.
- [ ] Lawyer review: refundable until a lawyer **starts** on it (the review
      queue's "claimed" state), not after.
- [ ] Courses: full refund within **7 days** of enrolling, only if **no
      lessons are completed** and no certificate issued.
- [ ] E-books, checklists, forms: **not refundable** once bought (they are
      downloadable immediately and repeatedly), except faulty or not as
      described.
- [ ] Refund timing stated as **5–7 working days** (a bank/Razorpay norm, not
      a promise we control).
- Code note: refunds are issued by an admin from the Orders screen; every
  refund issues a credit note and revokes access. The policy's windows are
  not checked automatically — staff apply them.

**Terms (`/terms`)**

- [ ] Minimum age **18** to make an account.
- [ ] Licence: personal or business use of purchased items; **no resale or
      redistribution**.
- [ ] Liability capped at **the amount paid for the item concerned**, to the
      extent the law allows.
- [ ] Governing law India; courts at the jurisdiction city above.
- [ ] Certificates described as a record of course completion, **not a
      professional qualification**.

**Privacy (`/privacy`)**

- [ ] Processors named: Razorpay, Resend, Cloudflare, the hosting provider,
      Google (sign-in), Anthropic and Voyage AI (assistant), Sentry (error reports),
      reviewing
      lawyers. Add the SMS provider (MSG91) when SMS sign-in goes live, and the
      hosting provider by name once chosen.
- [ ] Retention: account data while the account is open; invoices for as
      long as tax law requires; the rest deleted when no longer needed. **No
      fixed periods are stated** — decide whether to state them.
- [ ] Cross-border transfer: the draft says some providers process data
      outside India. Confirm this is acceptable under current DPDP rules.
- [ ] Certificates are public: name, course, date and score are visible to
      anyone with the code.

**Delivery (`/delivery`)**

- [ ] No review turnaround time is promised. Add one if the client wants to
      commit to it.

## 3. Things the pages describe that are true today

Checked against the code, so the lawyer knows what is fact rather than
policy:

- Sign-in is by one-time code (email; SMS later) or Google. No passwords.
- One essential cookie (the sign-in session). No analytics or advertising
  cookies, and nothing stored in the browser.
- Generating a document is free; payment unlocks a **one-time** download.
  There is **no preview before payment** — a preview PDF is produced but not
  shown to the customer.
- Every purchase gets a GST invoice; every refund a GST credit note.
- Card, UPI and bank details go to Razorpay only.
