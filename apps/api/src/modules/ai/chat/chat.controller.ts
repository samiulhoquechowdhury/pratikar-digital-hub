import { Body, Controller, Get, HttpCode, Post, Res } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";

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

  /**
   * The same answer, streamed as server-sent events — the site uses this, so
   * the reply appears as it's written rather than after a pause.
   *
   * A POST, not an EventSource GET: the conversation is the request body.
   * Errors before the first word are ordinary HTTP errors (thrown before any
   * header is written); later ones arrive as an "error" event. If the
   * visitor closes the chat mid-answer the model request is cancelled too,
   * so nobody pays for an answer no one is reading.
   */
  @Post("chat/stream")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async stream(@Body() dto: ChatRequestDto, @Res() res: Response) {
    const abort = new AbortController();
    res.on("close", () => abort.abort());

    let started = false;
    await this.chat.streamAnswer(
      dto.messages,
      (event) => {
        if (!started) {
          started = true;
          res.status(200);
          res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
          res.setHeader("Cache-Control", "no-cache, no-transform");
          // Tells nginx-style proxies not to buffer the stream into one blob.
          res.setHeader("X-Accel-Buffering", "no");
          res.flushHeaders();
        }
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      },
      abort.signal,
    );
    res.end();
  }
}
