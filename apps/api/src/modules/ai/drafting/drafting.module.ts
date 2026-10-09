import { Module } from "@nestjs/common";

import { StorageModule } from "../../storage/storage.module";
import { anthropicProvider } from "../chat/anthropic.provider";
import { KnowledgeBaseModule } from "../knowledge-base/knowledge-base.module";

import { DraftingService } from "./drafting.service";
import { PrecedentFinder } from "./precedents.service";

/**
 * Custom document drafting by Claude, modelled on the closest advocate-drafted
 * forms in the library (PrecedentFinder). Used by the document-generation worker
 * for CUSTOM documents; it has no routes of its own — the customer asks for
 * a draft through DocumentsController, like any other document.
 */
@Module({
  imports: [KnowledgeBaseModule, StorageModule],
  providers: [DraftingService, PrecedentFinder, anthropicProvider],
  exports: [DraftingService, PrecedentFinder],
})
export class DraftingModule {}
