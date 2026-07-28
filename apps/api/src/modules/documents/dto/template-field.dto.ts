import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

const FIELD_TYPES = ["text", "textarea", "date", "number", "select"] as const;

export class TemplateFieldOptionDto {
  @IsString()
  @IsNotEmpty()
  value!: string;

  @IsString()
  @IsNotEmpty()
  label!: string;
}

// Mirrors @pratikar/types TemplateField — keep the two in sync.
export class TemplateFieldDto {
  @IsString()
  @IsNotEmpty()
  key!: string;

  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsIn(FIELD_TYPES)
  type!: (typeof FIELD_TYPES)[number];

  @IsBoolean()
  required!: boolean;

  @IsOptional()
  @IsString()
  placeholder?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateFieldOptionDto)
  options?: TemplateFieldOptionDto[];
}
