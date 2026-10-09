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
import { Role } from "@pratikar/types";

import {
  CurrentUser,
  type RequestUser,
} from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";

import { UpsertFaqDto } from "./dto/faq.dto";
import { FaqService } from "./faq.service";

@Controller("faq")
@UseGuards(JwtAuthGuard, RolesGuard)
export class FaqController {
  constructor(private readonly faq: FaqService) {}

  /** The public FAQ page: published entries, grouped by category. */
  @Get()
  @Public()
  published() {
    return this.faq.published();
  }

  /** Declared before ":id" so "all" isn't read as an id. */
  @Get("all")
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  all() {
    return this.faq.all();
  }

  @Post()
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  create(@Body() dto: UpsertFaqDto, @CurrentUser() user: RequestUser) {
    return this.faq.create(dto, user.id);
  }

  @Put(":id")
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  update(
    @Param("id") id: string,
    @Body() dto: UpsertFaqDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.faq.update(id, dto, user.id);
  }

  @Delete(":id")
  @HttpCode(200)
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  remove(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.faq.remove(id, user.id);
  }
}
