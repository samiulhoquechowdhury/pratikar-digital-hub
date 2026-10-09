import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import { StorageModule } from "../storage/storage.module";

import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";
import {
  HealthController,
  ReadinessController,
} from "./readiness/readiness.controller";
import { HEALTH_QUEUE, ReadinessService } from "./readiness/readiness.service";

/** Cross-cutting views for the admin dashboard, the launch checklist and the health check. */
@Module({
  imports: [
    StorageModule,
    // Only for its Redis connection: the health check pings through it.
    // Nothing is ever added to it.
    BullModule.registerQueue({ name: HEALTH_QUEUE }),
  ],
  controllers: [AnalyticsController, ReadinessController, HealthController],
  providers: [AnalyticsService, ReadinessService],
})
export class AdminModule {}
