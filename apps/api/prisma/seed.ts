import { PrismaClient } from "@prisma/client";

import { StorageService } from "../src/modules/storage/storage.service";

import { buildRentAgreementDocx } from "./seed-assets/rent-agreement.template";

const TEMPLATE_FILE_KEY = "templates/rent-agreement.docx";

// Milestone 1, item 4 (docs/implementation-plan.md): one real Template row so
// the dynamic form renderer has something real to read `fieldSchema` from.
// "Rent Agreement" is a placeholder pick — the 100-template master taxonomy
// is still an open question (docs/srs.md Section 8, item 2); rename/recategorize
// once that's settled, the row itself doesn't need to change shape.
const RENT_AGREEMENT_FIELDS = [
  {
    key: "landlordName",
    label: "Landlord's full name",
    type: "text",
    required: true,
  },
  {
    key: "tenantName",
    label: "Tenant's full name",
    type: "text",
    required: true,
  },
  {
    key: "propertyAddress",
    label: "Property address",
    type: "textarea",
    required: true,
    placeholder: "Flat/house no., street, city, state, PIN",
  },
  {
    key: "monthlyRentInRupees",
    label: "Monthly rent (₹)",
    type: "number",
    required: true,
  },
  {
    key: "securityDepositInRupees",
    label: "Security deposit (₹)",
    type: "number",
    required: true,
  },
  {
    key: "agreementStartDate",
    label: "Agreement start date",
    type: "date",
    required: true,
  },
  {
    key: "durationInMonths",
    label: "Duration (months)",
    type: "number",
    required: true,
  },
  {
    key: "noticePeriodInDays",
    label: "Notice period for termination (days)",
    type: "number",
    required: false,
  },
];

const prisma = new PrismaClient();
const storage = new StorageService();

async function main() {
  const seedAuthor = await prisma.user.upsert({
    where: { email: "seed-content-manager@pratikar.internal" },
    update: {},
    create: {
      email: "seed-content-manager@pratikar.internal",
      name: "Seed Content Manager",
      role: "CONTENT_MANAGER",
    },
  });

  const docxBuffer = await buildRentAgreementDocx();
  await storage.upload(
    TEMPLATE_FILE_KEY,
    docxBuffer,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  );

  const existing = await prisma.template.findFirst({
    where: { title: "Rent Agreement" },
  });

  const data = {
    title: "Rent Agreement",
    category: "agreement", // placeholder — taxonomy TBD, see docs/srs.md Section 8
    priceInPaise: 19900,
    reviewPriceInPaise: 49900,
    fieldSchema: RENT_AGREEMENT_FIELDS,
    templateFileKey: TEMPLATE_FILE_KEY,
    status: "PUBLISHED" as const,
    createdBy: seedAuthor.id,
  };

  const template = existing
    ? await prisma.template.update({ where: { id: existing.id }, data })
    : await prisma.template.create({ data });

  // eslint-disable-next-line no-console
  console.log(
    `Seeded template "${template.title}" (${template.id}), status=${template.status}`,
  );
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
