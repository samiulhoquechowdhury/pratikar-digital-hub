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
import { CreditNoteService } from "./invoice/credit-note.service";
import { InvoiceService } from "./invoice/invoice.service";
import { PaymentsService } from "./payments.service";

@Controller("orders")
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly invoices: InvoiceService,
    private readonly creditNotes: CreditNoteService,
  ) {}

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

  /**
   * The GST invoice for an order, with a short-lived download URL.
   *
   * Staff may read any invoice; a customer is scoped to their own orders by
   * passing their id from the token as the ownership check. An invoice carries
   * a name, contact details and what somebody bought, so "knows the order id"
   * is not sufficient authorisation to read one.
   */
  @Get(":id/invoice")
  @UseGuards(JwtAuthGuard, RolesGuard)
  invoice(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    const isStaff =
      user.role === Role.SUPPORT ||
      user.role === Role.ADMIN ||
      user.role === Role.SUPER_ADMIN;
    return this.invoices.getForOrder(id, isStaff ? null : user.id);
  }

  /**
   * The credit note reversing an order's invoice, if one has been issued.
   * Same ownership rule as the invoice: staff may read any, a customer only
   * their own.
   */
  @Get(":id/credit-note")
  @UseGuards(JwtAuthGuard, RolesGuard)
  creditNote(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    const isStaff =
      user.role === Role.SUPPORT ||
      user.role === Role.ADMIN ||
      user.role === Role.SUPER_ADMIN;
    return this.creditNotes.getForOrder(id, isStaff ? null : user.id);
  }

  @Post(":id/refund")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  refund(
    @Param("id") id: string,
    @CurrentUser() user: RequestUser,
    @Body("reason") reason?: string,
  ) {
    return this.paymentsService.refund(id, user.id, reason);
  }
}
