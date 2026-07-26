import { Body, Controller, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { Role } from "@pratikar/types";

import { CurrentUser, type RequestUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { DocumentsService } from "./documents.service";
import { GenerateDocumentDto } from "./dto/generate-document.dto";
import { UpsertTemplateDto } from "./dto/upsert-template.dto";

@Controller("documents")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get("templates")
  listTemplates() {
    // Public catalog browsing — still behind JwtAuthGuard for now since there's
    // no separate "optional auth" guard yet; revisit once Visitor browsing
    // (SRS 2, Visitor role) needs to work without login.
    return this.documentsService.listPublishedTemplates();
  }

  @Post("templates")
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  createTemplate(@Body() dto: UpsertTemplateDto, @CurrentUser() user: RequestUser) {
    return this.documentsService.upsertTemplate(dto, user.id);
  }

  @Put("templates/:id")
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  updateTemplate(
    @Param("id") id: string,
    @Body() dto: UpsertTemplateDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.documentsService.upsertTemplate(dto, user.id, id);
  }

  @Post("generate")
  generate(@Body() dto: GenerateDocumentDto, @CurrentUser() user: RequestUser) {
    return this.documentsService.generate(user.id, dto);
  }

  @Get("mine")
  listMine(@CurrentUser() user: RequestUser) {
    return this.documentsService.listMine(user.id);
  }

  @Post(":id/download")
  download(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.documentsService.consumeDownload(id, user.id, user.role);
  }

  @Get("reviews/queue")
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  listReviewQueue() {
    return this.documentsService.listReviewQueue();
  }

  @Post("reviews/:id/claim")
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  claimReview(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.documentsService.claimReview(id, user.id);
  }

  @Put("reviews/:id/return")
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  returnReview(
    @Param("id") id: string,
    @Body() body: { reviewedFileUrl: string; notes?: string },
  ) {
    return this.documentsService.returnReview(id, body.reviewedFileUrl, body.notes);
  }
}
