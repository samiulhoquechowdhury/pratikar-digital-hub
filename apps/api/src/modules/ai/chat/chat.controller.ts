import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";

import { ChatService } from "./chat.service";
import { ChatRequestDto } from "./dto/chat.dto";

@Controller("ai")
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  /**
   * Whether the assistant answers for real or the site falls back to its
   * scripted preview — so the site labels it "Preview" only when it is one.
   * Reveals nothing but a yes or no; no provider, no model.
   */
  @Get("status")
  status() {
    return { assistant: this.chat.isConfigured };
  }

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
