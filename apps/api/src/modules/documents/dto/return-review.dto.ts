import { IsNotEmpty, IsOptional, IsString } from "class-validator";

/**
 * Replaces an inline `@Body() body: { ... }` annotation, which Nest does not
 * validate — the type was erased at runtime, so an empty reviewedFileUrl
 * reached the database and produced a RETURNED review pointing at nothing.
 */
export class ReturnReviewDto {
  @IsString()
  @IsNotEmpty()
  reviewedFileUrl!: string; // R2 key of the reviewed document

  @IsOptional()
  @IsString()
  notes?: string;
}
