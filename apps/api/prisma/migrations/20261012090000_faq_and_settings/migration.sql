-- The FAQ page's questions, and settings staff change without a redeploy.
CREATE TABLE "Faq" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Faq_published_category_order_idx" ON "Faq"("published", "category", "order");

CREATE TABLE "SiteSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);

-- Starter questions, UNPUBLISHED: drafted from how the site works, for the
-- client to correct and publish in Admin -> FAQ. Nothing here is on the
-- site until someone publishes it.
INSERT INTO "Faq" ("id", "question", "answer", "category", "order", "published", "updatedAt") VALUES
(gen_random_uuid()::text, 'How does the document generator work?', 'Pick a template, answer its questions in plain language — on the form, or by chatting with the assistant — and you get a preview of the finished document straight away. You pay only when you are happy with it, and then download it as a Word file and a PDF.', 'Documents', 1, false, now()),
(gen_random_uuid()::text, 'Can I download a document more than once?', 'A document bought from a template downloads once: the download link is used up the moment the file is sent, so save it somewhere safe when it arrives. A document reviewed by an advocate can be downloaded again from your account.', 'Documents', 2, false, now()),
(gen_random_uuid()::text, 'What if the document I need isn''t on the site?', 'Use AI drafting: describe the document in your own words and our AI drafts it in the format of our advocate-written documents. The draft is free to preview and change. A practising advocate then reviews it, and once reviewed it is ready to download.', 'Documents', 3, false, now()),
(gen_random_uuid()::text, 'What does an advocate review include?', 'A practising advocate reads your document, corrects it where needed and sends back a reviewed copy, with notes on anything you should check before signing. It is a check of that document — not advice about your wider situation.', 'Documents', 4, false, now()),
(gen_random_uuid()::text, 'How will I know my reviewed document is ready?', 'We tell you by email, by SMS to your phone number, in the notifications bell on the site, and — if you turn it on — with a notification on your phone or computer.', 'Documents', 5, false, now()),
(gen_random_uuid()::text, 'Are prices inclusive of GST?', 'Prices are shown including 18% GST, which is exactly what you pay. Every purchase comes with a GST invoice you can download from Orders & invoices in your account.', 'Payments', 1, false, now()),
(gen_random_uuid()::text, 'How do I pay?', 'Payments go through Razorpay: UPI, cards, net banking and wallets. Your purchase unlocks as soon as the payment is confirmed.', 'Payments', 2, false, now()),
(gen_random_uuid()::text, 'Can I get a refund?', 'Please see our Cancellation & Refunds page for when a refund is possible and how to ask for one.', 'Payments', 3, false, now()),
(gen_random_uuid()::text, 'How do I sign in?', 'There is no password. Enter your email address and we send a one-time code, or continue with your Google account.', 'Account', 1, false, now()),
(gen_random_uuid()::text, 'Can I delete my account or get a copy of my data?', 'Yes, both, from Account settings. Deleting your account erases your personal details and documents; invoices are kept without your details, as tax law requires.', 'Account', 2, false, now()),
(gen_random_uuid()::text, 'How does someone check my course certificate is genuine?', 'Every certificate has a unique ID and a QR code. Anyone can enter the ID on our Verify page, or scan the code, to see that it is genuine.', 'Courses', 1, false, now());
