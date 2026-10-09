import {
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class CertificateSettingsDto {
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  title!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  issuerName!: string;

  @IsString()
  @MaxLength(80)
  signatoryName!: string;

  @IsString()
  @MaxLength(80)
  signatoryTitle!: string;

  @IsString()
  @MaxLength(200)
  footerNote!: string;
}

export class PricingSettingsDto {
  /** ₹1 to ₹1,00,000, before GST. */
  @IsInt()
  @Min(100)
  @Max(10_000_000)
  customDraftReviewPricePaise!: number;
}
