import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Role } from "@pratikar/types";

import { Roles } from "../../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";

import { AssistantLog } from "./assistant-log.service";

/** The periods the insights screen offers. Anything else is clamped to 30. */
const PERIODS = new Set([7, 30, 90]);

/**
 * What customers ask the assistant, for the people who decide what the
 * catalogue should hold. Staff only — these are customers' own words.
 */
@Controller("ai/insights")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
export class AssistantInsightsController {
  constructor(private readonly log: AssistantLog) {}

  @Get()
  insights(
    @Query("days", new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    return this.log.insights(PERIODS.has(days) ? days : 30);
  }

  @Get("conversations")
  conversations() {
    return this.log.recentConversations(20);
  }
}
