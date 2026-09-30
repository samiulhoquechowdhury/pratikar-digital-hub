import { Body, Controller, HttpCode, Post, UseGuards } from "@nestjs/common";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";

import { ChatService } from "./chat.service";
import { ChatRequestDto } from "./dto/chat.dto";

@Controller("ai")
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  /**
   * One question, answered from the catalogue.
   *
   * Public, like the catalogue it talks about. Throttled per IP because every
   * call costs money at two providers — and the guard is attached here
   * explicitly: no ThrottlerGuard is registered app-wide, so @Throttle on its
   * own would be a decoration that limits nothing.
   */
  @Post("chat")
  @HttpCode(200)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  ask(@Body() dto: ChatRequestDto) {
    return this.chat.answer(dto.messages);
  }
}
