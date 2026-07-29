import { Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

export class CourseModuleDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsInt()
  @Min(0)
  order!: number;

  /** Cloudflare Stream UID — the video itself lives there, not in R2. */
  @IsString()
  @IsNotEmpty()
  videoAssetId!: string;
}

/**
 * Modules are replaced wholesale rather than patched individually. Reordering
 * a course is the common edit and it touches every row's `order`, so a
 * full-list PUT avoids a per-module PATCH storm that could leave the course
 * with duplicate or gapped positions halfway through.
 */
export class ReplaceModulesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CourseModuleDto)
  modules!: CourseModuleDto[];
}
