import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import { Role } from "@pratikar/types";

import { Roles } from "../../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";

import { KnowledgeBaseIndexer } from "./knowledge-base-indexer.service";
import { VoyageEmbedder } from "./voyage-embedder.service";

@Controller("ai/knowledge-base")
@UseGuards(JwtAuthGuard, RolesGuard)
export class KnowledgeBaseController {
  constructor(
    private readonly indexer: KnowledgeBaseIndexer,
    private readonly embedder: VoyageEmbedder,
  ) {}

  /**
   * How full the index is against what's published, whether a rebuild is
   * still running, and whether search is configured at all — the admin's
   * index panel. Content Managers see it; rebuilding is Admin's.
   */
  @Get("status")
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  async status() {
    return {
      configured: this.embedder.isConfigured,
      model: this.embedder.model,
      ...(await this.indexer.status()),
    };
  }

  /**
   * Re-examines every source. For the first fill after deploy, after setting
   * or changing the Voyage model, and as a repair if Redis was down while
   * things were being edited.
   *
   * Not audited: it changes no business data, only a derived index that it
   * rebuilds from that data. Cheap to repeat — unchanged rows are not
   * re-embedded.
   */
  @Post("reindex")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  reindex() {
    return this.indexer.reindexAll();
  }
}
