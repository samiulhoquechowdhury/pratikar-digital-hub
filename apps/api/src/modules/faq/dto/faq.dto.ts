import {
  IsBoolean,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class UpsertFaqDto {
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  question!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(3000)
  answer!: string;

  /** A heading on the FAQ page. */
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  category!: string;

  @IsInt()
  @Min(0)
  @Max(999)
  order!: number;

  @IsBoolean()
  published!: boolean;
}
