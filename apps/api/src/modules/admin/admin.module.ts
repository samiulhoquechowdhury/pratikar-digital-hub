import { Module } from "@nestjs/common";

import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";

/** Cross-cutting views for the admin dashboard. */
@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AdminModule {}
