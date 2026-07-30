import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
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

import { ContentLibraryService } from "./content-library.service";
import { UpsertContentItemDto } from "./dto/upsert-content-item.dto";

@Controller("content-library")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContentLibraryController {
  constructor(private readonly contentLibraryService: ContentLibraryService) {}

  @Get()
  list(@Query("category") category?: string) {
    return this.contentLibraryService.listPublished(category);
  }

  // Declared before ":id" — Nest matches in declaration order, so the literal
  // path has to win over the parameterised one.
  @Get("all")
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  listAll() {
    return this.contentLibraryService.listAll();
  }

  // Customer-facing detail view. Separate from the admin ":id" route below,
  // which returns every status and includes the storage key.
  @Get("catalogue/:id")
  getPublished(@Param("id") id: string) {
    return this.contentLibraryService.getPublished(id);
  }

  @Get(":id")
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  getById(@Param("id") id: string) {
    return this.contentLibraryService.getById(id);
  }

  // Any signed-in user; entitlement is checked in the service against the
  // caller's own id, so this can't be used to fetch someone else's purchase.
  @Post(":id/download")
  download(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.contentLibraryService.resolveDownload(id, user.id);
  }

  @Post()
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  create(@Body() dto: UpsertContentItemDto, @CurrentUser() user: RequestUser) {
    return this.contentLibraryService.upsert(dto, user.id);
  }

  @Put(":id")
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  update(
    @Param("id") id: string,
    @Body() dto: UpsertContentItemDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.contentLibraryService.upsert(dto, user.id, id);
  }
}
