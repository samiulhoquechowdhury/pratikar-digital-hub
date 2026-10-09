import { IsIn, IsInt, IsNotEmpty, IsString, Min } from "class-validator";

export const CATEGORIES = [
  "LEGAL_PRACTICE",
  "BUSINESS_COMPLIANCE",
  "PROPERTY_DOCUMENTATION",
  "DIGITAL_CAREER",
  "CHECKLISTS_REFERENCE",
] as const;

/** Kept next to CATEGORIES so both track the Prisma enums in one place. */
export const CONTENT_TYPES = ["EBOOK", "CHECKLIST", "FORM"] as const;

export class UpsertContentItemDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsIn(CATEGORIES)
  category!: (typeof CATEGORIES)[number];

  @IsIn(CONTENT_TYPES)
  type!: (typeof CONTENT_TYPES)[number];

  @IsInt()
  @Min(0)
  priceInPaise!: number;

  @IsString()
  @IsNotEmpty()
  fileUrl!: string;

  @IsIn(["DRAFT", "PUBLISHED", "ARCHIVED"])
  status!: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}
