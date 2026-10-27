import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

const ITEM_TYPES = [
  "DOCUMENT",
  "DOCUMENT_REVIEW",
  "CONTENT_ITEM",
  "COURSE",
] as const;

export class CreateOrderDto {
  @IsIn(ITEM_TYPES)
  itemType!: (typeof ITEM_TYPES)[number];

  // Refers to a GeneratedDocument (for DOCUMENT and DOCUMENT_REVIEW),
  // ContentLibraryItem, or Course id, depending on itemType.
  @IsString()
  @IsNotEmpty()
  itemId!: string;

  /** A discount code, checked again here whatever the checkout showed. */
  @IsOptional()
  @IsString()
  @MaxLength(32)
  couponCode?: string;
}
