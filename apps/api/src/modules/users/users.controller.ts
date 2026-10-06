import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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

import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { UsersService } from "./users.service";

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
