import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";

/**
 * Limits that keep one request from costing much. The endpoint is public,
 * so every token a caller can make us send to the model is a token anyone
 * can make us pay for.
 */
export const CHAT_LIMITS = {
  /** Characters per turn — a long question, not a pasted contract. */
  maxTurnLength: 2000,
  /** Turns of history sent back, the new question included. */
  maxTurns: 12,
} as const;

export class ChatTurnDto {
  @IsIn(["user", "assistant"])
  role!: "user" | "assistant";

  @IsString()
  @IsNotEmpty()
  @MaxLength(CHAT_LIMITS.maxTurnLength)
  content!: string;
}

export class ChatRequestDto {
  /** The conversation so far, oldest first, ending with the new question. */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(CHAT_LIMITS.maxTurns)
  @ValidateNested({ each: true })
  @Type(() => ChatTurnDto)
  messages!: ChatTurnDto[];

  /**
   * The browser's id for this chat, so its questions read as one
   * conversation in the assistant log. A UUID it made up — nothing about
   * the visitor. Left out, nothing is logged.
   */
  @IsOptional()
  @IsUUID()
  conversationId?: string;
}
