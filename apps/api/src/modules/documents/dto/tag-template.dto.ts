import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from "class-validator";

/**
 * A key becomes a docxtemplater tag in the .docx and a key in
 * GeneratedDocument.filledData. docxtemplater resolves {tagName} by plain
 * property lookup, so anything outside identifier characters either fails to
 * match or renders blank — and a blank clause in a legal document is a
 * silent, legally meaningful defect rather than a visible error.
 */
const KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

export class TagFieldDto {
  /** Which blank, by the index readBlanks gave it. */
  @IsInt()
  @Min(0)
  index!: number;

  @Matches(KEY_PATTERN, {
    message:
      "key must start with a letter or underscore and contain only letters, digits and underscores",
  })
  key!: string;

  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsIn(["text", "textarea", "date", "number", "select"])
  type!: string;

  @IsBoolean()
  required!: boolean;
}

export class CreateTemplateFromStorageDto {
  @IsString()
  @IsNotEmpty()
  storageKey!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsInt()
  @Min(0)
  priceInPaise!: number;

  @IsInt()
  @Min(0)
  reviewPriceInPaise!: number;

  /**
   * Only the blanks being turned into fields. Leaving one out is allowed and
   * deliberate — a half-converted form still prints and is still fillable by
   * hand, so a template can be built up over more than one sitting.
   */
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TagFieldDto)
  fields!: TagFieldDto[];
}
