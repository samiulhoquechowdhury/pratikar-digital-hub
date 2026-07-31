import { Document, Packer, Paragraph, TextRun } from "docx";

// Builds the actual .docx asset for the seeded "Rent Agreement" Template
// (docs/implementation-plan.md Milestone 1 item 5). Tags use docxtemplater's
// default `{tag}` delimiter and match the field keys in prisma/seed.ts's
// RENT_AGREEMENT_FIELDS exactly — the worker fills this file with
// GeneratedDocument.filledData at generation time.
export async function buildRentAgreementDocx(): Promise<Buffer> {
  const paragraph = (text: string) =>
    new Paragraph({ children: [new TextRun(text)] });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: "RENT AGREEMENT", bold: true, size: 32 }),
            ],
          }),
          paragraph(""),
          paragraph(
            "This Rent Agreement is made and entered into on {agreementStartDate}, between:",
          ),
          paragraph(""),
          paragraph(
            '{landlordName} (hereinafter referred to as the "Landlord")',
          ),
          paragraph("AND"),
          paragraph('{tenantName} (hereinafter referred to as the "Tenant")'),
          paragraph(""),
          paragraph(
            "WHEREAS the Landlord is the owner of the property situated at {propertyAddress} " +
              '(hereinafter referred to as the "Premises") and has agreed to let out the Premises ' +
              "to the Tenant on the terms and conditions set out below.",
          ),
          paragraph(""),
          new Paragraph({
            children: [new TextRun({ text: "1. TERM", bold: true })],
          }),
          paragraph(
            "This Agreement shall be for a period of {durationInMonths} months commencing " +
              "from {agreementStartDate}.",
          ),
          paragraph(""),
          new Paragraph({
            children: [new TextRun({ text: "2. RENT", bold: true })],
          }),
          paragraph(
            "The Tenant shall pay to the Landlord a monthly rent of Rs. {monthlyRentInRupees}, " +
              "payable in advance on or before the 5th day of each calendar month.",
          ),
          paragraph(""),
          new Paragraph({
            children: [
              new TextRun({ text: "3. SECURITY DEPOSIT", bold: true }),
            ],
          }),
          paragraph(
            "The Tenant has paid to the Landlord a refundable interest-free security deposit of " +
              "Rs. {securityDepositInRupees}, to be refunded at the end of the tenancy subject to " +
              "deductions for damages, if any.",
          ),
          paragraph(""),
          new Paragraph({
            children: [new TextRun({ text: "4. TERMINATION", bold: true })],
          }),
          paragraph(
            "Either party may terminate this Agreement by giving {noticePeriodInDays} days' " +
              "written notice to the other party.",
          ),
          paragraph(""),
          paragraph(
            "IN WITNESS WHEREOF the parties hereto have set their hands on the date first " +
              "above written.",
          ),
          paragraph(""),
          paragraph("_______________________          _______________________"),
          paragraph(
            "Landlord ({landlordName})              Tenant ({tenantName})",
          ),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
