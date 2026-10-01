import {
  Body,
  Controller,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";

import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";

import { DocumentFillService } from "./document-fill.service";
import { FillRequestDto } from "./dto/fill.dto";

@Controller("ai/documents")
@UseGuards(JwtAuthGuard)
export class DocumentFillController {
  constructor(private readonly fill: DocumentFillService) {}

  /**
   * One turn of filling a template by conversation.
   *
   * Signed-in only, like generating a document: the answers belong to an
   * account. Throttled per IP, below the app-wide default, because each turn
   * is a paid model call.
   */
  @Post(":templateId/fill")
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  turn(@Param("templateId") templateId: string, @Body() dto: FillRequestDto) {
    return this.fill.fill(templateId, dto.messages, dto.answers);
  }
}
