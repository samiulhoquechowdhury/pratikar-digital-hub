import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class UpsertCourseDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(0)
  priceInPaise!: number;

  /**
   * Confirmed policy (docs/srs.md Section 7, item 2): access expires after this
   * window while the certificate is kept. Minimum 1 — a zero-day course would
   * enrol customers into content that has already expired.
   */
  @IsInt()
  @Min(1)
  accessDurationDays!: number;

  @IsIn(["DRAFT", "PUBLISHED", "ARCHIVED"])
  status!: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}
