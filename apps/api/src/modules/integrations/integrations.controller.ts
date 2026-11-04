import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Role } from "@pratikar/types";

import {
  CurrentUser,
  type RequestUser,
} from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";

import { SetIntegrationDto, TestIntegrationDto } from "./dto/integrations.dto";
import { IntegrationsService } from "./integrations.service";
import { IntegrationsTester } from "./integrations.tester";

/** Service keys — Super Admin only, every route. */
@Controller("admin/integrations")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class IntegrationsController {
  constructor(
    private readonly integrations: IntegrationsService,
    private readonly tester: IntegrationsTester,
  ) {}

  @Get()
  list() {
    return this.integrations.list();
  }

  @Put(":key")
  async set(
    @Param("key") key: string,
    @Body() dto: SetIntegrationDto,
    @CurrentUser() user: RequestUser,
  ) {
    await this.integrations.set(key, dto.value, user.id);
    return this.integrations.list();
  }

  @Delete(":key")
  async clear(@Param("key") key: string, @CurrentUser() user: RequestUser) {
    await this.integrations.clear(key, user.id);
    return this.integrations.list();
  }

  // A test can send an SMS, so it's rate limited like a sign-in.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post(":id/test")
  @HttpCode(200)
  test(@Param("id") id: string, @Body() dto: TestIntegrationDto) {
    return this.tester.test(id, dto.phone);
  }
}

/**
 * What the website and the app need to know about the services, and may:
 * public identifiers only — Razorpay's key ID and Google's client ID are
 * meant to be in a browser. Read at load, so changing them in the admin
 * panel needs no rebuild of either.
 */
@Controller("config")
export class PublicConfigController {
  constructor(private readonly integrations: IntegrationsService) {}

  @Public()
  @Get("public")
  get() {
    return {
      razorpayKeyId: this.integrations.get("RAZORPAY_KEY_ID") || null,
      // The first is the website's; any others are the apps'.
      googleClientId:
        this.integrations.get("GOOGLE_CLIENT_ID").split(",")[0]?.trim() || null,
    };
  }
}
