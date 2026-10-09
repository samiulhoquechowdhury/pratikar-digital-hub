import { Body, Controller, Get, Param, Put, UseGuards } from "@nestjs/common";
import { Role } from "@pratikar/types";

import {
  CurrentUser,
  type RequestUser,
} from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";

import { SettingsService } from "./settings.service";

@Controller("settings")
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  /** The certificate's wording — public, like the certificate itself. */
  @Get("certificate")
  @Public()
  certificate() {
    return this.settings.get("certificate");
  }

  /** Every setting, for the admin's Settings page. */
  @Get()
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  list(@CurrentUser() user: RequestUser) {
    return this.settings.list(user.role);
  }

  /**
   * Saves one setting. Who may change which is per setting (see
   * settings.definitions.ts) and checked in the service.
   */
  @Put(":key")
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  update(
    @Param("key") key: string,
    @Body() body: unknown,
    @CurrentUser() user: RequestUser,
  ) {
    return this.settings.update(key, body, user);
  }
}
