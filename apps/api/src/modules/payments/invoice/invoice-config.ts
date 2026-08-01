import { Injectable, Logger } from "@nestjs/common";

/**
 * Who the supplier is, for the top of the invoice.
 *
 * None of this is secret — it is printed on every invoice we issue — but it is
 * deployment-specific, so it lives in env rather than in the repo. The client
 * has not supplied the real values yet (docs/implementation-plan.md, open
 * blocker 5), and that is exactly why `isConfigured` exists: without them we
 * can still record the sale correctly, we just must not print something that
 * looks like a valid tax invoice.
 */
export interface SellerIdentity {
  legalName: string;
  gstin: string;
  /** Free text; newlines are honoured when printed. */
  address: string;
  stateCode: string;
}

/**
 * SAC (service accounting) codes per item type.
 *
 * Rule 46 requires the code on the invoice. These are the most defensible
 * readings of what we sell, but classification is an accountant's call, not a
 * developer's — every one of them is overridable by env so the client's CA can
 * correct them without a deploy.
 */
const DEFAULT_SAC: Readonly<Record<string, string>> = {
  // Legal documentation drafted from a template.
  DOCUMENT: "998213",
  // A professional reviewing that draft.
  DOCUMENT_REVIEW: "998213",
  // Sale of an e-book / checklist as digital content.
  CONTENT_ITEM: "998439",
  // Commercial training and coaching.
  COURSE: "999293",
};

@Injectable()
export class InvoiceConfig {
  private readonly logger = new Logger(InvoiceConfig.name);

  readonly seller: SellerIdentity | null;
  readonly numberPrefix = (
    process.env.INVOICE_NUMBER_PREFIX ?? "PDH"
  ).toUpperCase();

  constructor() {
    this.seller = this.readSeller();

    if (!this.seller) {
      this.logger.warn(
        "Company GST details are not configured (COMPANY_LEGAL_NAME, COMPANY_GSTIN, " +
          "COMPANY_ADDRESS, COMPANY_STATE_CODE). Invoices will still be numbered and " +
          "recorded, but their PDFs will be marked PROFORMA and are not valid tax invoices.",
      );
    }
  }

  get isConfigured(): boolean {
    return this.seller !== null;
  }

  sacFor(itemType: string): string {
    return (
      process.env[`INVOICE_SAC_${itemType}`] ?? DEFAULT_SAC[itemType] ?? "9983"
    );
  }

  /**
   * The state we supply from. Used to decide CGST+SGST versus IGST, so it is
   * needed even in proforma mode — falling back to "97 / Other Territory"
   * keeps the arithmetic total correct while making it obvious on the face of
   * the document that the split has not been configured.
   */
  get sellerStateCode(): string {
    return this.seller?.stateCode ?? "97";
  }

  private readSeller(): SellerIdentity | null {
    const legalName = process.env.COMPANY_LEGAL_NAME?.trim();
    const gstin = process.env.COMPANY_GSTIN?.trim().toUpperCase();
    const address = process.env.COMPANY_ADDRESS?.trim();
    const stateCode = process.env.COMPANY_STATE_CODE?.trim();

    if (!legalName || !gstin || !address || !stateCode) return null;

    // A GSTIN carries its own state code in the first two characters. If it
    // disagrees with COMPANY_STATE_CODE then one of them is a typo, and either
    // way every invoice would carry a wrong CGST/SGST/IGST split — so refuse
    // the configuration rather than silently pick one.
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]{3}$/.test(gstin)) {
      this.logger.error(
        `COMPANY_GSTIN "${gstin}" is not a valid 15-character GSTIN — treating the company as unconfigured.`,
      );
      return null;
    }
    if (gstin.slice(0, 2) !== stateCode) {
      this.logger.error(
        `COMPANY_GSTIN starts with state code ${gstin.slice(0, 2)} but COMPANY_STATE_CODE is ${stateCode}. ` +
          "One of them is wrong, and every invoice would carry the wrong tax split — treating the company as unconfigured.",
      );
      return null;
    }

    return { legalName, gstin, address, stateCode };
  }
}
