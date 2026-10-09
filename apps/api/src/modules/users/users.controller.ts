import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Put,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Role } from "@pratikar/types";

import {
  CurrentUser,
  type RequestUser,
} from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";

import { AccountPrivacyService } from "./account-privacy.service";
import { DeleteAccountDto } from "./dto/delete-account.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { UsersService } from "./users.service";

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly privacy: AccountPrivacyService,
  ) {}

  @Get()
  @Roles(Role.SUPPORT, Role.ADMIN, Role.SUPER_ADMIN)
  listAll() {
    return this.usersService.listAll();
  }

  /**
   * The signed-in person's own profile. Declared before ":id" so "me" isn't
   * read as an id; no @Roles, because every account may read itself.
   */
  @Get("me")
  me(@CurrentUser() user: RequestUser) {
    return this.usersService.getProfile(user.id);
  }

  @Patch("me")
  updateMe(@Body() dto: UpdateProfileDto, @CurrentUser() user: RequestUser) {
    return this.usersService.updateProfile(user.id, dto);
  }

  /**
   * Everything personal held about the signed-in customer, as JSON — the
   * "summary of personal data" the DPDP Act gives them a right to.
   * Declared before ":id". Throttled: it reads every table they appear in.
   */
  @Get("me/export")
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  exportMe(@CurrentUser() user: RequestUser) {
    return this.privacy.exportData(user.id);
  }

  /** Erases the signed-in customer's account. See AccountPrivacyService. */
  @Delete("me")
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  async deleteMe(
    @Body() _dto: DeleteAccountDto,
    @CurrentUser() user: RequestUser,
  ) {
    await this.privacy.deleteAccount(user.id);
    return { deleted: true };
  }

  @Get(":id")
  @Roles(Role.SUPPORT, Role.ADMIN, Role.SUPER_ADMIN)
  getById(@Param("id") id: string) {
    return this.usersService.getById(id);
  }

  @Put(":id/role")
  @Roles(Role.SUPER_ADMIN)
  updateRole(
    @Param("id") id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.usersService.updateRole(id, dto.role, user.id);
  }
}
