import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
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

import {
  DocumentsService,
  MAX_REVIEWED_FILE_BYTES,
  type UploadedReviewFile,
} from "./documents.service";
import { DraftCustomDto, ReviseDraftDto } from "./dto/draft-custom.dto";
import { GenerateDocumentDto } from "./dto/generate-document.dto";
import { ReturnReviewDto } from "./dto/return-review.dto";
import { CreateTemplateFromStorageDto } from "./dto/tag-template.dto";
import { UpsertTemplateDto } from "./dto/upsert-template.dto";

@Controller("documents")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // Public: the catalogue is what persuades a visitor to sign up (SRS 2,
  // Visitor role). Customer-safe columns only — see listPublishedTemplates.
  @Get("templates")
  @Public()
  listTemplates() {
    return this.documentsService.listPublishedTemplates();
  }

  // Public detail view, PUBLISHED only. Separate from the staff
  // "templates/:id" route below, which returns every status and every column.
  // Declared before it so "catalogue" is not read as an id.
  @Get("templates/catalogue/:id")
  @Public()
  getPublishedTemplate(@Param("id") id: string) {
    return this.documentsService.getPublishedTemplate(id);
  }

  // Declared before "templates/:id" — Nest matches routes in declaration
  // order, so the literal path has to win over the parameterised one.
  @Get("templates/all")
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  listAllTemplates() {
    return this.documentsService.listAllTemplates();
  }

  /**
   * The .docx forms in storage that a template could be built from.
   * Declared before "templates/:id" so the literal path is not read as an id.
   */
  @Get("templates/storage")
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  listTaggableStorage(@Query("prefix") prefix?: string) {
    return this.documentsService.listTaggableStorage(prefix);
  }

  /**
   * The blanks in a stored form, with a suggested name and type for each.
   * Declared before "templates/:id" so the literal path is not read as an id.
   */
  @Get("templates/blanks")
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  readBlanks(@Query("key") key: string) {
    return this.documentsService.readBlanks(key);
  }

  /** Tags a stored form and registers the result as a DRAFT template. */
  @Post("templates/from-storage")
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  createFromStorage(
    @Body() dto: CreateTemplateFromStorageDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.documentsService.createTemplateFromStorage(dto, user.id);
  }

  @Get("templates/:id")
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  getTemplate(@Param("id") id: string) {
    return this.documentsService.getTemplateById(id);
  }

  @Post("templates")
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  createTemplate(
    @Body() dto: UpsertTemplateDto,
    @CurrentUser() user: RequestUser,
  ) {
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

  /** Public: the custom-draft page shows the price before sign-in. */
  @Get("custom/pricing")
  @Public()
  customPricing() {
    return this.documentsService.customPricing();
  }

  /**
   * A custom document, drafted by the AI from the customer's description.
   * Throttled well below the default: each one is a long model call.
   */
  @Post("custom")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  draftCustom(@Body() dto: DraftCustomDto, @CurrentUser() user: RequestUser) {
    return this.documentsService.draftCustom(user.id, dto);
  }

  @Post(":id/revise")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  reviseCustom(
    @Param("id") id: string,
    @Body() dto: ReviseDraftDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.documentsService.reviseCustom(id, user.id, dto.instruction);
  }

  @Get("mine")
  listMine(@CurrentUser() user: RequestUser) {
    return this.documentsService.listMine(user.id);
  }

  @Get("mine/:id")
  getMine(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.documentsService.getMine(id, user.id);
  }

  /** The advocate-reviewed copy. Repeatable, unlike the one-time download. */
  @Post(":id/reviewed-download")
  reviewedDownload(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.documentsService.reviewedDownload(id, user.id);
  }

  @Get(":id/preview")
  preview(@Param("id") id: string, @CurrentUser() user: RequestUser) {
    return this.documentsService.getPreview(id, user.id, user.role);
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

  /** The customer's document and what it was made from, for the reviewer. */
  @Get("reviews/:id/files")
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  reviewFiles(@Param("id") id: string) {
    return this.documentsService.reviewFiles(id);
  }

  /** The reviewer's marked-up file, Word or PDF. Returns its storage key. */
  @Post("reviews/:id/file")
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: MAX_REVIEWED_FILE_BYTES } }),
  )
  uploadReviewedFile(
    @Param("id") id: string,
    @UploadedFile() file: UploadedReviewFile | undefined,
    @CurrentUser() user: RequestUser,
  ) {
    return this.documentsService.uploadReviewedFile(id, user.id, file);
  }

  @Put("reviews/:id/return")
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  returnReview(
    @Param("id") id: string,
    @Body() dto: ReturnReviewDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.documentsService.returnReview(id, dto, user.id);
  }
}
