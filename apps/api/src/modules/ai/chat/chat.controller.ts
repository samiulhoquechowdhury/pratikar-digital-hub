import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";

import { ChatService, type ChatContext } from "./chat.service";
import { ChatRequestDto } from "./dto/chat.dto";

@Controller("ai")
export class ChatController {
  constructor(
    private readonly chat: ChatService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * The chat is public, so there's no guard to identify the visitor. A
   * signed-in customer's browser still sends its token; when it verifies,
   * their questions are tied to their account — which is what lets them
   * download or erase them along with everything else. A missing or stale
   * token is not an error here: they're simply asking as a visitor.
   */
  private async contextOf(
    req: Request,
    conversationId?: string,
  ): Promise<ChatContext> {
    const header = req.headers.authorization;
    let userId: string | null = null;
    if (header?.startsWith("Bearer ")) {
      try {
        const payload = await this.jwt.verifyAsync<{ sub: string }>(
          header.slice("Bearer ".length),
        );
        userId = payload.sub;
      } catch {
        userId = null;
      }
    }
    return { conversationId, userId };
  }

  /**
   * Whether the assistant is live, so the site can say plainly when it's
   * offline. Reveals nothing but a yes or no; no provider, no model.
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
  async ask(@Body() dto: ChatRequestDto, @Req() req: Request) {
    return this.chat.answer(
      dto.messages,
      await this.contextOf(req, dto.conversationId),
    );
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
  async stream(
    @Body() dto: ChatRequestDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const context = await this.contextOf(req, dto.conversationId);
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
      context,
    );
    res.end();
  }
}
