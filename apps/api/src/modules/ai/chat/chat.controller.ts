import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";

import { ChatService } from "./chat.service";
import { ChatRequestDto } from "./dto/chat.dto";

@Controller("ai")
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  /**
   * One question, answered from the catalogue.
   *
   * Public, like the catalogue it talks about. Throttled per IP, well below
   * the app-wide default, because every call costs money at two providers.
   */
  @Post("chat")
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  ask(@Body() dto: ChatRequestDto) {
    return this.chat.answer(dto.messages);
  }
}
