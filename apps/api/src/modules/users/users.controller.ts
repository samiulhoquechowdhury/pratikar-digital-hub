import { Body, Controller, Get, Param, Put, UseGuards } from "@nestjs/common";
import { Role } from "@pratikar/types";

import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
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

  @Get(":id")
  @Roles(Role.SUPPORT, Role.ADMIN, Role.SUPER_ADMIN)
  getById(@Param("id") id: string) {
    return this.usersService.getById(id);
  }

  @Put(":id/role")
  @Roles(Role.SUPER_ADMIN)
  updateRole(@Param("id") id: string, @Body("role") role: Role) {
    return this.usersService.updateRole(id, role);
  }
}
