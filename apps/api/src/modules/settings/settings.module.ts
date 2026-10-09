import { Global, Module } from "@nestjs/common";

import { AuditModule } from "../audit/audit.module";

import { SettingsController } from "./settings.controller";
import { SettingsService } from "./settings.service";

/**
 * Global: documents, payments and the certificate all read settings, and
 * none of them should have to remember to import this.
 */
@Global()
@Module({
  imports: [AuditModule],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
