import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { Role } from "@pratikar/types";

import {
  CurrentUser,
  type RequestUser,
} from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";

import { CouponsService } from "./coupons.service";
import { UpsertCouponDto } from "./dto/coupon.dto";

/**
 * The admin's coupons. Money decisions, so Admin and Super Admin only. The
 * customer-facing check lives with checkout, at POST /orders/quote.
 */
@Controller("coupons")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class CouponsController {
  constructor(private readonly coupons: CouponsService) {}

  @Get()
  list() {
    return this.coupons.list();
  }

  @Post()
  create(@Body() dto: UpsertCouponDto, @CurrentUser() user: RequestUser) {
    return this.coupons.create(dto, user.id);
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpsertCouponDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.coupons.update(id, dto, user.id);
  }
}
