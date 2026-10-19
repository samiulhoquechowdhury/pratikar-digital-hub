import { Module } from "@nestjs/common";

import { AuditModule } from "../audit/audit.module";

import { CouponsController } from "./coupons.controller";
import { CouponsService } from "./coupons.service";

/** Discount codes: the admin's list, and the check checkout makes. */
@Module({
  imports: [AuditModule],
  controllers: [CouponsController],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}
