import { IsIn, IsInt, IsNotEmpty, IsString, Min } from "class-validator";

const CATEGORIES = [
  "LEGAL_PRACTICE",
  "BUSINESS_COMPLIANCE",
  "PROPERTY_DOCUMENTATION",
  "DIGITAL_CAREER",
  "CHECKLISTS_REFERENCE",
] as const;

export class UpsertContentItemDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsIn(CATEGORIES)
  category!: (typeof CATEGORIES)[number];

  @IsIn(["EBOOK", "CHECKLIST"])
  type!: "EBOOK" | "CHECKLIST";

  @IsInt()
  @Min(0)
  priceInPaise!: number;

  @IsString()
  @IsNotEmpty()
  fileUrl!: string;

  @IsIn(["DRAFT", "PUBLISHED", "ARCHIVED"])
  status!: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}
