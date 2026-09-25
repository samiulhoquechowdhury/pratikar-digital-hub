import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

import { CATEGORIES, CONTENT_TYPES } from "./upsert-content-item.dto";

export class ImportContentItemDto {
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

  /** The storage key the file already lives at — nothing is uploaded here. */
  @IsString()
  @IsNotEmpty()
  fileUrl!: string;
}

export class ImportContentItemsDto {
  /**
   * Capped at 500. The catalogue is a few hundred files, so a whole-bucket
   * import fits in one request — but an unbounded array would let a single
   * call write unbounded rows inside one transaction.
   */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => ImportContentItemDto)
  items!: ImportContentItemDto[];

  /**
   * Defaults to false — imported rows land as DRAFT. Publishing several
   * hundred items to a live storefront should be something an operator opts
   * into, not what happens when the field is omitted.
   */
  @IsOptional()
  @IsBoolean()
  publish?: boolean;
}
