import { Global, Module } from "@nestjs/common";

import { AuditModule } from "../audit/audit.module";

import {
  IntegrationsController,
  PublicConfigController,
} from "./integrations.controller";
import { IntegrationsService } from "./integrations.service";
import { IntegrationsTester } from "./integrations.tester";

/** Global: every module that calls an outside service reads its key here. */
@Global()
@Module({
  imports: [AuditModule],
  controllers: [IntegrationsController, PublicConfigController],
  providers: [IntegrationsService, IntegrationsTester],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
