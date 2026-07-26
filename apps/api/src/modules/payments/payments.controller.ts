import { Body, Controller, Headers, Param, Post, Req, UseGuards } from "@nestjs/common";
import { Role } from "@pratikar/types";
import type { Request } from "express";

import { CurrentUser, type RequestUser } from "../../common/decorators/current-user.decorator";
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
  // NOTE: this requires the raw request body for signature verification —
  // main.ts needs a raw-body exception for this specific route (Nest's
  // default body parser JSON-parses before this handler sees it). Wire that
  // up via `bodyParser: false` + a manual raw-body middleware scoped to this
  // path when this goes from stub to real.
  @Post("webhook")
  webhook(
    @Req() req: Request,
    @Headers("x-razorpay-signature") signature: string,
    @Body() payload: { razorpayOrderId: string; razorpayPaymentId: string; event: "payment.captured" | "payment.failed" },
  ) {
    const rawBody = (req as Request & { rawBody?: string }).rawBody ?? JSON.stringify(payload);
    return this.paymentsService.handleWebhook(rawBody, signature, payload);
  }

  @Post(":id/refund")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  refund(@Param("id") id: string) {
    return this.paymentsService.refund(id);
  }
}
