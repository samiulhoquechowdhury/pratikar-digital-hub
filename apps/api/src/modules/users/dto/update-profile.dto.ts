import { Transform } from "class-transformer";
import { IsString, Length } from "class-validator";

/**
 * What a customer can change about themselves without proving anything.
 *
 * Only the name. Email and phone are how an account signs in, so changing
 * either needs a code sent to the new address first — that flow doesn't
 * exist yet, and accepting an unverified address here would let anyone with
 * a stolen session move the account to an inbox they control.
 */
export class UpdateProfileDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim().replace(/\s+/g, " ") : value,
  )
  @IsString()
  // The name goes on invoices and certificates.
  @Length(1, 80)
  name!: string;
}
