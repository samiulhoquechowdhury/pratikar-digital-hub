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

/**
 * Bootstraps the first SUPER_ADMIN. Without this there is no way into the
 * admin panel at all: OTP signup always creates a CUSTOMER, and the only
 * endpoint that can change a role (PUT /users/:id/role) is itself gated to
 * SUPER_ADMIN — so a fresh deployment has nobody who can promote anybody.
 *
 * Set BOOTSTRAP_SUPER_ADMIN_EMAIL to your own address before seeding a real
 * environment; the account signs in through the normal OTP flow afterwards,
 * so no password ever exists for it.
 */
async function bootstrapSuperAdmin() {
  const email = process.env.BOOTSTRAP_SUPER_ADMIN_EMAIL;
  if (!email) {
    // eslint-disable-next-line no-console
    console.warn(
      "BOOTSTRAP_SUPER_ADMIN_EMAIL not set — skipping super-admin bootstrap. " +
        "Nobody will be able to sign in to the admin panel until one exists.",
    );
    return;
  }

  // Deliberately does not demote an existing user: re-running the seed must
  // not silently change somebody's privileges, and an existing account with a
  // higher role is not something a seed script should touch.
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "Bootstrap Super Admin", role: "SUPER_ADMIN" },
  });

  if (user.role !== "SUPER_ADMIN") {
    // eslint-disable-next-line no-console
    console.warn(
      `${email} already exists with role ${user.role}; left unchanged. ` +
        "Promote it deliberately if that's what you intended.",
    );
    return;
  }

  // eslint-disable-next-line no-console
  console.log(`Super admin ready: ${email} (${user.id})`);
}

async function main() {
  await bootstrapSuperAdmin();

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
