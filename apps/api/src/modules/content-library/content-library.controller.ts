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

  @Post()
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  create(@Body() dto: UpsertContentItemDto) {
    return this.contentLibraryService.upsert(dto);
  }

  @Put(":id")
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  update(@Param("id") id: string, @Body() dto: UpsertContentItemDto) {
    return this.contentLibraryService.upsert(dto, id);
  }
}
