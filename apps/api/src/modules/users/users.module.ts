import { Module } from "@nestjs/common";

import { AuditModule } from "../audit/audit.module";
import { StorageModule } from "../storage/storage.module";

import { AccountPrivacyService } from "./account-privacy.service";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  imports: [AuditModule, StorageModule],
  controllers: [UsersController],
  providers: [UsersService, AccountPrivacyService],
  exports: [UsersService],
})
export class UsersModule {}
