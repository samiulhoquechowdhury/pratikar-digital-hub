import { Transform } from "class-transformer";
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from "class-validator";

const KINDS = ["PERCENT", "FLAT"] as const;
const ITEM_TYPES = [
  "DOCUMENT",
  "DOCUMENT_REVIEW",
  "CONTENT_ITEM",
  "COURSE",
] as const;

export class UpsertCouponDto {
  /** Letters, digits, - and _; stored upper-case. */
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Matches(/^[A-Z0-9_-]{3,32}$/, {
    message: "code must be 3–32 letters, digits, - or _",
  })
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  description?: string | null;

  @IsIn(KINDS)
  kind!: (typeof KINDS)[number];

  /** 1–100 for PERCENT (checked in the service); paise for FLAT. */
  @IsInt()
  @Min(1)
  value!: number;

  @IsOptional()
  @IsInt()
  @Min(100)
  maxDiscountInPaise?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  minOrderInPaise?: number | null;

  @IsArray()
  @ArrayUnique()
  @IsIn(ITEM_TYPES, { each: true })
  appliesTo!: (typeof ITEM_TYPES)[number][];

  @IsOptional()
  @IsDateString()
  startsAt?: string | null;

  @IsOptional()
  @IsDateString()
  endsAt?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxRedemptions?: number | null;

  @IsInt()
  @Min(1)
  @Max(100)
  perUserLimit!: number;

  @IsBoolean()
  active!: boolean;
}

/** "Does this code work on this item?" — asked by checkout. */
export class CouponQuoteDto {
  @IsString()
  @MaxLength(32)
  code!: string;

  @IsIn(ITEM_TYPES)
  itemType!: (typeof ITEM_TYPES)[number];

  @IsString()
  itemId!: string;
}
