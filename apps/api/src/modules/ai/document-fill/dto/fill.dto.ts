import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsObject,
  IsOptional,
  ValidateNested,
} from "class-validator";

import { ChatTurnDto } from "../../chat/dto/chat.dto";

/**
 * Longer than the site assistant's conversations: filling a document is a
 * dozen or so questions, each a turn. Still bounded, because every turn is
 * sent back to the model and the endpoint costs money per call.
 */
export const FILL_LIMITS = { maxTurns: 40 } as const;

export class FillRequestDto {
  /** The conversation so far, oldest first, ending with the customer's turn. */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(FILL_LIMITS.maxTurns)
  @ValidateNested({ each: true })
  @Type(() => ChatTurnDto)
  messages!: ChatTurnDto[];

  /**
   * The answers recorded so far, as the browser last received them. Checked
   * again here like anything else from the browser — never trusted.
   */
  @IsOptional()
  @IsObject()
  answers?: Record<string, unknown>;
}
