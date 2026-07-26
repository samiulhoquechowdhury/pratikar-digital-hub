# Pratikar Digital Hub — Software Requirements Specification (SRS)

**Prepared by:** Loobnity (Sam)
**Status:** Living document — refined as each module is designed in detail
**Companion doc:** `pratikar-system-architecture.md`

---

## 1. Purpose & Scope

This SRS defines what Pratikar Digital Hub does, for whom, and who controls what — across the customer-facing web app, the Android app, the admin dashboard, and the AI modules. It is the single reference we build every module against.

**In scope:** Website, Android App, Customer Dashboard, Admin Dashboard, Document Automation System, Document Review (advocate review), Content Library, LMS, Digital Store / commerce layer, Payment System, AI Document Generator, AI Chatbot (RAG), Notifications, Affiliate Management System, Franchise Management Module.

**Explicitly out of scope:** Live Classes.

**Scope change note:** Affiliate Management System and Franchise Management Module were originally excluded from the signed agreement and have now been added back into scope. This has contract/pricing implications beyond this document — flagged for the agreement amendment, not just a documentation update. Functional requirements for these two modules are not yet defined (see Section 8, Open Questions).

---

## 2. User Roles

| Role | Description |
|---|---|
| **Visitor** | Unauthenticated. Can browse public content (template list, content library catalog, course catalog) but not preview, generate, or purchase. |
| **Customer** | Authenticated end user (OTP login). Generates documents, buys content/courses, manages their dashboard. |
| **Support** | Internal staff. Views customer accounts, orders, and payment status to resolve tickets. No content or pricing control. |
| **Content Manager** | Internal staff. Manages templates, content library items, and courses — creation, editing, publishing, pricing. No access to payments/refunds or user management. |
| **Admin** | Internal staff. Full operational control: users, orders, refunds, content, courses — everything short of system-level settings. |
| **Super Admin** | Full control including admin/staff account management, role assignment, and system configuration. |

Section 7 has the full role × capability matrix.

---

## 3. Functional Requirements

### 3.1 Authentication & User Management

- Signup/login via **email or phone OTP** — no password.
- OTP: 6-digit code, short expiry (5–10 min), rate-limited per phone/email and per IP.
- Session: access token (~15 min) + rotating refresh token (7–30 days). Web uses httpOnly cookies; Android uses encrypted storage.
- **Multi-device is expected as normal** — logging in on a new device does not revoke sessions on other devices. Customer dashboard offers "log out this device" and "log out everywhere" separately.
- Profile: name, email, phone, address (needed for invoices), saved document details (see 3.2) for reuse across future documents.
- Account deletion / data export on request (recommended for compliance — flagging as open question on whether client needs this explicitly).

### 3.2 Document Automation System

- **100 master templates**, categorized (e.g. agreements, affidavits, notices — exact taxonomy still TBD with client; not the same list as the confirmed Content Library e-book taxonomy in 3.4).
- **Dynamic form builder**: each template defines its own field set (name, address, dates, clauses, etc.) rendered as a guided form. Admin/Content Manager can create/edit templates and their field definitions without a code deploy.
- **Flow:**
  1. Customer selects a template.
  2. Fills the dynamic form (or completes it via the AI Document Generator conversationally — see 3.3).
  3. System generates the document (docxtemplater → PDF/DOCX) and shows a **watermarked preview** — free, no login-gated paywall to see the *result*, but download is paid.
  4. Customer pays → gets a signed, **one-time-use** download link for the clean PDF/DOCX. Once used, the link is invalidated (confirmed policy — Section 7).
  5. Generated documents still appear in the customer's dashboard history for record-keeping, marked "downloaded" once consumed.
  6. **Optional advocate review** (paid add-on, requested after payment): customer sends the downloaded document for review from their dashboard → it enters the **Admin Dashboard review queue** → a Content Manager (a licensed advocate) reviews it, makes any corrections, and marks it reviewed/sent back → customer gets a **mobile push notification** that their reviewed document is ready → customer re-downloads the reviewed version from their dashboard (does not count against the original one-time-download limit, since this is a distinct add-on transaction).
- Admin/Content Manager controls: add/edit/archive templates, edit field definitions, set price per template (and per-review price), view generation analytics (most-used templates), **manage the review queue** (claim/review/return submissions).

### 3.3 AI Modules

**3.3.1 AI Document Generator**
- Conversational alternative to the dynamic form: user describes what they need ("I need a rental agreement"), the AI identifies the correct template, then asks for the required fields one at a time (name, dates, terms, etc.) until the document can be generated.
- Output feeds into the same generation pipeline as the manual form (3.2) — same preview/pay/download flow.

**3.3.2 AI Chatbot Assistant (RAG)**
- General-purpose assistant available site-wide. Capabilities:
  - Answers questions about the website/platform itself (how things work, pricing, policies).
  - Helps a user figure out *which* legal document they need, then hands off into the AI Document Generator flow.
  - Recommends courses based on stated needs/interests.
- RAG knowledge base: site content, FAQ, template catalog, course catalog — needs to be built and kept in sync as content changes (indexing pipeline required whenever a template/course/content item is added or edited).
- Admin control: Content Manager/Admin can view chatbot conversation logs (for quality/training) and manage the underlying knowledge base content.

### 3.4 Content Library

- **500 checklists + 50 e-books**, browsable/searchable catalog, categorized.
- **Confirmed e-book taxonomy (5 categories):** Legal Practice (15 titles), Business & Compliance (10), Property & Documentation (10), Digital & Career (10), Checklists & Ready-Reference (5, includes the 500-checklist bundle) — plus 500 standalone legal checklists sold/organized separately within the same library.
- Preview (cover/excerpt) is free; full download is pay-per-item. Re-download policy (one-time like documents, or unlimited) — **not yet confirmed for this module specifically**, added to Section 8.
- Admin/Content Manager: upload/edit/archive items, set pricing, categorize, view sales analytics per item.

### 3.5 LMS (Learning Management System)

- **50 courses**, each with video lessons (Cloudflare Stream), and presumably a syllabus/module structure — exact per-course structure TBD with client.
- Purchase model: **pay-per-course, access expires 6 months after purchase.**
- On enrollment: customer gets dashboard access to course content until expiry; system tracks progress (lessons completed).
- **Certificates**: issued on course completion, before expiry. Carries a verifiable ID — a **public certificate-verification page** (enter ID → confirm validity) is confirmed as required (Section 7).
- Expiry handling: system notifies the customer before their 6-month window closes (see Notifications, 3.8). **Confirmed:** after expiry, the customer keeps their certificate and its verification record, but loses video/course-content access.
- Admin/Content Manager: create/edit/publish courses, upload video, set pricing, view enrollment analytics, manage certificate templates.

### 3.6 Digital Store / Commerce Layer

Unifying commerce layer sitting across Documents, Content Library, and Courses — one cart/checkout experience regardless of item type:

- Cart (or direct single-item checkout — most of these are single-item purchases by nature, e.g. "download this one document").
- Order creation → Razorpay checkout → payment confirmation → entitlement granted (download unlocked / course access granted).
- Order history, invoices — **confirmed: must be GST-compliant** (GSTIN, tax breakdown), downloadable receipts.

### 3.7 Payment System — complete flow

1. Customer takes an action that requires payment (download a generated document, download a content library item, enroll in a course, **request advocate review**).
2. System creates an **Order** record (status: `pending`) with item reference, amount, customer.
3. Frontend opens Razorpay checkout with the order.
4. **On success:** Razorpay returns a payment reference → frontend confirms with backend → backend **independently verifies with Razorpay webhook** (never trusts the frontend alone — prevents payment spoofing) → order status → `paid` → entitlement granted (download unlocked / enrollment activated) → invoice generated → confirmation notification sent.
5. **On failure/abandonment:** order stays `pending`/`failed`, customer can retry; no entitlement granted.
6. **Webhook reconciliation job** (background, BullMQ): periodically reconciles any order stuck in `pending` against Razorpay's actual status, in case a webhook was missed — prevents "paid but not unlocked" support tickets.
7. **Refunds:** **confirmed — Admin issues refunds directly** from the admin dashboard, no Support-approval step. Admin action → Razorpay refund API → order status → `refunded` → entitlement revoked (course access removed if within window) → customer notified. Eligibility window/conditions still open (Section 8) — worth resolving especially for documents, given one-time download makes "did they already get the value" ambiguous once the link is consumed.
8. **Downloads:** download links are signed, short-lived URLs from R2, generated on-demand. **Documents are one-time-use** — the link is invalidated after first use (Section 7). Content library re-download policy still open (Section 8). Course video access follows enrollment status, not a link-consumption model.

### 3.8 Notifications

- OTP delivery (SMS/email).
- Purchase confirmation + invoice (email).
- Course expiry reminder (e.g. 7 days before the 6-month window closes).
- Certificate issued.
- **Document review ready** — mobile **push notification** (Android app) once a Content Manager/advocate completes a review and returns the document.
- Admin-side: new order, new review-queue submission, refund request (if a request/approval flow exists rather than direct admin refund — TBD).
- **Channels:** email (Resend), SMS (MSG91, pending DLT), push (Android — provider TBD, e.g. FCM).

### 3.9 Customer Dashboard

- My Documents (generated history, re-download, **request advocate review** on a downloaded document).
- My Purchases (content library items owned, re-download).
- My Courses (enrolled, progress, certificate download, expiry date visible).
- Order history & invoices.
- Profile management.

### 3.10 Admin Dashboard

Role-gated per Section 7. Core areas: Users, Orders/Payments, Templates, **Document Review Queue** (Content Manager claims/reviews/returns submitted documents), Content Library, Courses, AI Chatbot logs/knowledge base, Analytics, Staff & Roles (Super Admin only), System Settings (Super Admin only), **Affiliate Management** (newly in scope — requirements not yet defined, see Section 8), **Franchise Management** (newly in scope — requirements not yet defined, see Section 8).

### 3.11 Android App

Mirrors the customer-facing web app feature set (browse, generate, purchase, dashboard, chatbot, **push notifications**). Admin functions are web-only.

### 3.12 Affiliate Management System *(newly in scope — placeholder)*

Newly added to scope (Section 1). No functional requirements defined yet — needs a dedicated scoping pass covering referral tracking, commission structure, payout mechanism, and affiliate-facing dashboard. See Section 8, item 4.

### 3.13 Franchise Management Module *(newly in scope — placeholder)*

Newly added to scope (Section 1). No functional requirements defined yet — needs a dedicated scoping pass covering franchise onboarding, territory/branch management, revenue sharing, and franchise-level admin access. See Section 8, item 5.

---

## 4. Non-Functional Requirements

- **Security:** encryption at rest for stored documents; audit log for admin actions and document access; rate limiting on OTP and document-generation endpoints; signed short-lived download URLs.
- **Performance:** document generation queued (not blocking the request thread) since DOCX→PDF conversion is CPU-heavy.
- **Availability:** target standard uptime for a commercial platform (specific SLA TBD — this is a business decision, not just technical).
- **Scalability:** modular monolith designed so any module (e.g. document generation, video delivery) can be split out later if it becomes a bottleneck.
- **Compliance:** payment data never touches our servers directly (Razorpay hosted checkout/tokenization); GST/invoicing compliance TBD pending client confirmation.

---

## 5. Core Data Entities (high level)

`User`, `Role`, `Template`, `TemplateField`, `GeneratedDocument`, `ContentLibraryItem`, `Course`, `CourseModule`, `Enrollment`, `Certificate`, `Order`, `Payment`, `Invoice`, `ChatbotConversation`, `KnowledgeBaseDocument`.

(Full schema to be designed per-module as we build each one — this is a reference list, not the final ERD.)

---

## 6. Role × Capability Matrix

| Capability | Customer | Support | Content Manager | Admin | Super Admin |
|---|:---:|:---:|:---:|:---:|:---:|
| Generate/buy documents, content, courses | ✅ | – | – | – | – |
| View own orders/downloads | ✅ | – | – | – | – |
| View any customer's account/orders (support) | – | ✅ | – | ✅ | ✅ |
| Issue refunds | – | – | – | ✅ | ✅ |
| Create/edit templates | – | – | ✅ | ✅ | ✅ |
| Set pricing (incl. review add-on price) | – | – | ✅ | ✅ | ✅ |
| **Review submitted documents (advocate review)** | – | – | ✅ | ✅ | ✅ |
| Manage content library items | – | – | ✅ | ✅ | ✅ |
| Create/edit courses, upload video | – | – | ✅ | ✅ | ✅ |
| View/manage chatbot knowledge base | – | – | ✅ | ✅ | ✅ |
| View platform analytics | – | – | partial | ✅ | ✅ |
| Manage staff accounts & roles | – | – | – | – | ✅ |
| System configuration | – | – | – | – | ✅ |

---

## 7. Resolved Decisions (previously open questions)

1. **Document re-download:** one download only. Once consumed, the signed download link is invalidated — no repeat re-downloads of the same purchase.
2. **Course expiry behavior:** after the 6-month window, the customer keeps their certificate (and its verification record) but loses video/content access.
3. **Refund policy:** eligibility window/conditions still TBD — flagged separately below.
4. **GST/invoicing:** required. Invoices must be GST-compliant (GSTIN, tax breakdown).
5. **Certificate verification:** required. A public page where anyone can enter a certificate ID and confirm validity.
6. **Refund approval flow:** Admin can issue refunds directly — no Support-raises/Admin-approves intermediate step.
7. **Content library taxonomy (confirmed):** 5 e-book categories — Legal Practice (15), Business & Compliance (10), Property & Documentation (10), Digital & Career (10), Checklists & Ready-Reference (5, incl. the 500-checklist bundle) — plus the separate 500 standalone legal checklists. Master document-template taxonomy (the 100 generator templates) is still open — see below.

## 8. Remaining Open Questions

1. **Refund policy specifics:** eligibility window and conditions for documents, content items, and courses respectively — download-once (Section 7.1) makes document refunds especially worth pinning down (is a refund even possible after the one-time download is used?).
2. **Master template taxonomy:** the 100 legal *document generator* templates (agreements, notices, affidavits, etc.) still need their own category list — separate from the e-book/checklist taxonomy just confirmed, which covers the Content Library, not the Document Automation System.
3. **Session policy:** confirmed multi-device (Section 3.1 update — login does not revoke other sessions).
4. **Affiliate Management System requirements:** newly added to scope (previously excluded) — no functional requirements defined yet. Needs its own scoping pass (referral tracking, commission structure, payout mechanism, affiliate dashboard) before it can be added to Section 3 or the architecture doc.
5. **Franchise Management Module requirements:** same as above — newly in scope, requirements undefined. Needs its own scoping pass (franchise onboarding, territory/branch management, revenue sharing, franchise-level admin access) before it can be speced.
6. **Reviewer role granularity:** is *every* Content Manager expected to be a licensed advocate capable of reviewing documents, or is "reviews documents" a distinct sub-permission only some Content Managers hold (e.g. a separate `Reviewer`/`Advocate` role sharing Content Manager's other permissions)? Affects the role model in Section 2/6 and the `packages/types` `Role` enum.
7. **Review turnaround:** is there an expected SLA for how quickly a Content Manager must review a submitted document? Affects whether a reminder/escalation notification is needed for the admin side.

---

## Next steps

With this SRS as the shared reference, we go module by module starting with Phase 1 (`AuthModule`, `UsersModule`), designing schema + API contract + admin controls for each before writing code.
