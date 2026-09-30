import { Module } from "@nestjs/common";

import { anthropicProvider } from "../chat/anthropic.provider";

import { DocumentFillController } from "./document-fill.controller";
import { DocumentFillService } from "./document-fill.service";

/**
 * The AI document generator: fills a template's fields by conversation. It
 * produces answers, not documents — generation still goes through
 * DocumentsService.generate(), which validates them again.
 */
@Module({
  controllers: [DocumentFillController],
  providers: [DocumentFillService, anthropicProvider],
})
export class DocumentFillModule {}
