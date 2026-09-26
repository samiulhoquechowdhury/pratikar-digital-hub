import { Controller, Post, UseGuards } from "@nestjs/common";
import { Role } from "@pratikar/types";

import { Roles } from "../../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";

import { KnowledgeBaseIndexer } from "./knowledge-base-indexer.service";

@Controller("ai/knowledge-base")
@UseGuards(JwtAuthGuard, RolesGuard)
export class KnowledgeBaseController {
  constructor(private readonly indexer: KnowledgeBaseIndexer) {}

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
