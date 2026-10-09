import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { Role } from "@pratikar/types";
import { Transform } from "class-transformer";
import { IsIn, IsOptional } from "class-validator";

import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";

import {
  ANALYTICS_PERIODS,
  AnalyticsService,
  type AnalyticsPeriod,
} from "./analytics.service";

class AnalyticsQuery {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => Number(value))
  @IsIn(ANALYTICS_PERIODS)
  days?: AnalyticsPeriod;
}

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  /**
   * Sales, generation and sign-up numbers for the admin dashboard. Content
   * Managers see them too: the requirements give them the generation and
   * per-item sales figures, and those are most of this.
   */
  @Get("analytics")
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  overview(@Query() query: AnalyticsQuery) {
    return this.analytics.overview(query.days ?? 30);
  }
}
