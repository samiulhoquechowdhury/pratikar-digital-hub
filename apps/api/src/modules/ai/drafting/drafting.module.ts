import { Module } from "@nestjs/common";

import { anthropicProvider } from "../chat/anthropic.provider";

import { DraftingService } from "./drafting.service";

/**
 * Custom document drafting by Claude. Used by the document-generation worker
 * for CUSTOM documents; it has no routes of its own — the customer asks for
 * a draft through DocumentsController, like any other document.
 */
@Module({
  providers: [DraftingService, anthropicProvider],
  exports: [DraftingService],
})
export class DraftingModule {}
