import { IsIn, IsInt, IsNotEmpty, IsObject, IsString, Min } from "class-validator";

export class UpsertTemplateDto {
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

  @IsObject()
  fieldSchema!: Record<string, unknown>;

  @IsIn(["DRAFT", "PUBLISHED", "ARCHIVED"])
  status!: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}
