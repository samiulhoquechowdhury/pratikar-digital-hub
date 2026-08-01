import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

/**
 * Which enrolment the attempt belongs to. Sent by the client but never
 * trusted — QuizService checks it against the token's user id before the
 * attempt is created.
 */
export class StartAttemptDto {
  @IsUUID()
  enrollmentId!: string;
}

export class SaveAnswerDto {
  @IsString()
  @IsNotEmpty()
  questionId!: string;

  /**
   * Null clears the answer. A learner who changes their mind and wants a
   * question blank again should be able to say so — it isn't the same as
   * never having seen it.
   */
  @IsOptional()
  @IsString()
  selectedOptionId?: string | null;
}
