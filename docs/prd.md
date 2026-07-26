# Pratikar Digital Hub — Product Requirements Document (PRD)

**Prepared by:** Loobnity (Sam)
**Status:** Living document
**Companion docs:** `docs/srs.md` (functional detail), `docs/architecture.md` (technical detail)

---

## 1. Product Vision

Pratikar Digital Hub is a self-serve legal platform for India: generate the legal document you need in minutes instead of booking a lawyer for routine paperwork, learn the legal/business skills to handle compliance yourself through courses and reference material, and get AI-guided help figuring out what you actually need in the first place.

The wedge is **speed and accessibility** — legal documentation in India is traditionally slow (finding a lawyer, back-and-forth drafting, unclear pricing). This platform compresses that into a self-serve flow: describe your need → get a correct, customized document → pay only for what you use.

## 2. Problem Statement

- Getting a routine legal document (rental agreement, notice, affidavit) drafted usually means finding and paying a lawyer for something templatable.
- People don't know *which* document they need, or what legal steps apply to their situation (property purchase, starting a business, a dispute).
- Legal and compliance knowledge (GST registration, company incorporation, property due diligence) is scattered and inconsistently reliable online.

## 3. Target Users

| Persona | Need |
|---|---|
| **Individual, one-off need** | Rental agreement, legal notice, affidavit — wants it fast and correctly filled, doesn't want to hire a lawyer for something routine |
| **Small business / startup founder** | Incorporation, GST/MSME registration, contracts, compliance checklists — wants a reliable self-serve reference plus documents |
| **Property buyer/seller** | Due diligence guidance, registration documents, dispute-avoidance checklists |
| **Early-career advocates / legal professionals** | Practice guides, drafting handbooks, court procedure references (the "Legal Practice E-Books" category) |
| **Anyone upskilling** | Courses on legal practice, business compliance, and adjacent digital/career skills |

## 4. Goals & Success Signals

Primary goals for the platform (in rough priority order):

1. **Document generation is correct and fast** — the core trust-building interaction. A wrong or malformed legal document is the single worst outcome for this product.
2. **Self-serve discovery works** — a user who doesn't know what they need should reliably end up at the right document/course via the AI chatbot, not bounce.
3. **Payment friction is minimal** — preview free, pay only at the point of real value (download / course access), so the "is this even relevant to me" evaluation happens before money changes hands.
4. **Content library and courses build recurring reasons to return**, beyond one-off document generation.

*(Specific numeric targets — conversion rate, MRR, retention — aren't set yet; add them here once there's real usage data or client-provided targets.)*

## 5. Scope

**In scope** (per the signed agreement, Chapters I–VII, as amended):
Website, Android App, Customer Dashboard, Admin Dashboard, Document Automation System (100 templates), Document Review (advocate review, paid add-on), Content Library (500 checklists + 50 e-books), LMS (50 courses), Digital Store / Payment System, AI Document Generator, AI Chatbot (RAG), Notifications (incl. mobile push), **Affiliate Management System**, **Franchise Management Module**.

**Explicitly out of scope:**
Live Classes.

**Scope change note:** Affiliate Management System and Franchise Management Module were previously excluded and have now been added back into scope — this needs to be reflected in the contract amendment/pricing, not just this document. Functional requirements for both are undefined pending a dedicated scoping pass (see `docs/srs.md` Section 8).

## 6. Feature Summary by Area

*(Full functional detail lives in `docs/srs.md` — this is the product-level summary.)*

- **Document Generator** — pick a template (or describe the need to the AI), fill a guided form, preview watermarked, pay once, get a one-time-use download link. Optionally, after payment, request a **paid advocate review** — a licensed-advocate Content Manager reviews and returns the document via the admin queue, and the customer gets a mobile push notification when it's ready.
- **AI Chatbot Assistant** — site-wide, answers platform questions, helps identify the right document, recommends courses, hands off into the document flow.
- **Content Library** — browse/search e-books and checklists across 5 categories (Legal Practice, Business & Compliance, Property & Documentation, Digital & Career, Checklists & Ready-Reference); preview free, pay per item to download.
- **LMS** — enroll in a course, video lessons, progress tracking, certificate on completion (publicly verifiable), 6-month access window (certificate stays valid and viewable after expiry; video access does not).
- **Customer Dashboard** — document history, purchases, enrolled courses with expiry dates, order history/invoices, profile, session management (multi-device supported).
- **Admin Dashboard** — role-gated across 4 internal roles (Support, Content Manager, Admin, Super Admin); covers user support, content/course management, orders and direct refunds, staff/role management.
- **Payments** — Razorpay, GST-compliant invoicing, webhook-verified confirmation, admin-direct refunds.
- **Android App** — mirrors the customer-facing web feature set.

## 7. Representative User Stories

- *As a customer*, I want to describe my situation in plain language to the chatbot and be pointed to the right document, so I don't have to already know legal terminology.
- *As a customer*, I want to preview my generated document before paying, so I can confirm it's actually what I need.
- *As a customer*, I want my purchased courses to show a clear expiry date, so I know when to complete them.
- *As a Content Manager*, I want to add or update a document template's fields without needing a developer, so the catalog can grow independently of engineering time.
- *As an Admin*, I want to issue a refund directly from an order, without a multi-step approval chain, so support issues resolve quickly.
- *As anyone*, I want to enter a certificate ID on a public page and confirm it's real, so credentials from this platform are trustworthy to third parties (employers, clients).

## 8. Monetization

Pay-per-value, no subscription:

| Item | Price point | Access model |
|---|---|---|
| Generated legal document | Per document | One-time download link |
| Content library item (e-book/checklist) | Per item | Download (re-download policy still open — see `docs/srs.md` Section 8) |
| Course | Per course | 6-month access, certificate persists after expiry |

## 9. Roles & Access (summary)

Customer (self-serve) · Support (view-only account/order help) · Content Manager (catalog/course/template management) · Admin (full operations incl. refunds) · Super Admin (staff/role/system control). Full capability matrix in `docs/srs.md` Section 6.

## 10. Assumptions & Risks

- **AI accuracy risk:** the AI Document Generator collecting wrong/incomplete details produces a legally deficient document — this is the highest-consequence failure mode in the product and should get disproportionate QA attention.
- **DLT registration (SMS OTP)** status with the client is unconfirmed — could delay SMS-based login/notifications if not already in progress.
- **Refund policy** isn't finalized, particularly awkward for documents given the one-time-download model — needs a business decision before the Payments module is fully built.
- **Master template taxonomy** (the 100 generator templates) isn't finalized — needed before the Document module's browse/category UI can be built.

## 11. Open Questions

See `docs/srs.md` Section 8 for the current list (refund policy specifics, master template taxonomy) — kept in one place to avoid the two docs drifting out of sync.

---

## Next steps

PRD, SRS, and architecture now form the full reference set for the project. Next build step remains the Prisma schema for `User`/`Role`/`OtpRequest`/`Session`, unblocking the `AuthModule` TODOs already scaffolded in Milestone 0.
