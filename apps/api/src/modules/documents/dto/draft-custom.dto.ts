import { GST_STATE_NAMES } from "@pratikar/types";
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

/**
 * Limits that keep one draft from costing much: a long, specific brief, not
 * a pasted contract to rewrite.
 */
export const DRAFT_LIMITS = {
  documentType: 120,
  details: 4000,
  instruction: 1000,
} as const;

/** What the customer asks the AI to draft. */
export class DraftCustomDto {
  /** e.g. "Leave and licence agreement for a flat in Pune". */
  @IsString()
  @MinLength(3)
  @MaxLength(DRAFT_LIMITS.documentType)
  documentType!: string;

  /** The parties, amounts, dates and terms, in their own words. */
  @IsString()
  @MinLength(20)
  @MaxLength(DRAFT_LIMITS.details)
  details!: string;

  @IsOptional()
  @IsIn(Object.keys(GST_STATE_NAMES))
  stateCode?: string;
}

/** A change to a custom draft, in the customer's words. */
export class ReviseDraftDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(DRAFT_LIMITS.instruction)
  instruction!: string;
}
