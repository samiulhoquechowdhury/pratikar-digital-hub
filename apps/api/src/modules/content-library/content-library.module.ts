import { Module } from "@nestjs/common";

import { AuditModule } from "../audit/audit.module";
import { StorageModule } from "../storage/storage.module";

import { ContentLibraryController } from "./content-library.controller";
import { ContentLibraryService } from "./content-library.service";

@Module({
  imports: [AuditModule, StorageModule],
  controllers: [ContentLibraryController],
  providers: [ContentLibraryService],
  exports: [ContentLibraryService],
})
export class ContentLibraryModule {}
