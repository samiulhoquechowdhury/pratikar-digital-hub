import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  type RawBodyRequest,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Role } from "@pratikar/types";
import type { Request } from "express";

import {
  CurrentUser,
  type RequestUser,
} from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";

import { CreateOrderDto } from "./dto/create-order.dto";
import { PaymentsService } from "./payments.service";

@Controller("orders")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: RequestUser) {
    return this.paymentsService.createOrder(user.id, dto);
  }

  // No JwtAuthGuard — this is called by Razorpay, not the logged-in user.
  // Trust boundary is the signature check inside handleWebhook, not auth.
  //
  // req.rawBody is populated by `rawBody: true` in main.ts; the signature is
  // an HMAC over those exact bytes, so the parsed @Body() is deliberately not
  // used here.
  //
  // Responds 200 rather than Nest's default 201 for POST: Razorpay retries
  // anything outside 2xx, and 200 is what its dashboard tests expect.
  @Post("webhook")
  @HttpCode(HttpStatus.OK)
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("x-razorpay-signature") signature: string,
  ) {
    if (!req.rawBody) throw new BadRequestException("MISSING_RAW_BODY");
    return this.paymentsService.handleWebhook(
      req.rawBody.toString("utf8"),
      signature,
    );
  }

  // Declared before ":id/refund" so the literal path isn't captured as an id.
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPPORT, Role.ADMIN, Role.SUPER_ADMIN)
  list() {
    return this.paymentsService.listOrders();
  }

  // No @Roles — any signed-in user, and scoped to their own id from the token
  // rather than a path param, so one customer can't read another's history.
  @Get("mine")
  @UseGuards(JwtAuthGuard, RolesGuard)
  listMine(@CurrentUser() user: RequestUser) {
    return this.paymentsService.listMyOrders(user.id);
  }

  @Post(":id/refund")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  refund(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.paymentsService.refund(id, user.id);
  }
}
