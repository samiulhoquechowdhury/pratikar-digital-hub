import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

export class QuizOptionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  text!: string;

  @IsBoolean()
  isCorrect!: boolean;
}

export class QuizQuestionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  prompt!: string;

  // Two is the minimum that makes a question a question; six is where a
  // multiple-choice list stops being readable on a phone.
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => QuizOptionDto)
  options!: QuizOptionDto[];
}

/**
 * Wholesale replacement of a module's quiz, the same shape as
 * ReplaceModulesDto: `order` is the array index rather than a field an
 * operator has to keep consistent by hand.
 *
 * "Exactly one correct option per question" is checked in the service rather
 * than here — class-validator can't express a rule across a nested array, and
 * a quiz where a question has no right answer is unscoreable rather than
 * merely untidy.
 */
export class UpsertQuizDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  // 30s floor stops a fat-fingered 5 from making a quiz unpassable; 3h ceiling
  // is well past any legitimate module test and keeps expiresAt sane.
  @IsInt()
  @Min(30)
  @Max(10_800)
  timeLimitSeconds!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionDto)
  questions!: QuizQuestionDto[];
}
