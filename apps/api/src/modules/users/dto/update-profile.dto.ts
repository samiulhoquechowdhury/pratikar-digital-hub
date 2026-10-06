import { GST_STATE_NAMES } from "@pratikar/types";
import { Transform } from "class-transformer";
import { IsIn, IsOptional, IsString, Length, Matches } from "class-validator";

/** Trims and collapses spaces; an empty answer becomes null, which clears it. */
const tidy = ({ value }: { value: unknown }) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed === "" ? null : trimmed;
};

/**
 * What a customer can change about themselves without proving anything.
 *
 * Their name and billing address. Not email or phone: those are how the
 * account signs in, so changing either needs a code sent to the new address
 * first — that flow doesn't exist yet, and accepting an unverified address
 * here would let anyone with a stolen session move the account to an inbox
 * they control.
 */
export class UpdateProfileDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim().replace(/\s+/g, " ") : value,
  )
  @IsString()
  // The name goes on invoices and certificates.
  @Length(1, 80)
  name!: string;

  @Transform(tidy)
  @IsOptional()
  @IsString()
  @Length(1, 200)
  addressLine?: string | null;

  @Transform(tidy)
  @IsOptional()
  @IsString()
  @Length(1, 80)
  city?: string | null;

  /** A GST state code — it decides CGST + SGST versus IGST on the invoice. */
  @Transform(tidy)
  @IsOptional()
  @IsIn(Object.keys(GST_STATE_NAMES))
  stateCode?: string | null;

  @Transform(tidy)
  @IsOptional()
  @Matches(/^[1-9]\d{5}$/, { message: "pincode must be a 6-digit PIN code" })
  pincode?: string | null;
}
