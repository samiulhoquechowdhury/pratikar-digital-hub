import { IsBoolean, IsOptional, IsString, MaxLength } from "class-validator";

/**
 * How a reviewer returns a review: with the key of the file they uploaded
 * for it (POST reviews/:id/file), or by approving the draft unchanged. The
 * service refuses a request that does neither.
 */
export class ReturnReviewDto {
  @IsOptional()
  @IsString()
  reviewedFileUrl?: string; // storage key under reviews/<reviewId>/

  @IsOptional()
  @IsBoolean()
  approveAsDrafted?: boolean;

  /** Shown to the customer with the reviewed document. */
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;
}
