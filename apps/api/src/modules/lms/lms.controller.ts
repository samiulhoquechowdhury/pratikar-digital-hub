import {
  Body,
  Controller,
  Get,
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
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";

import { ReplaceModulesDto } from "./dto/replace-modules.dto";
import { UpsertCourseDto } from "./dto/upsert-course.dto";
import { LmsService } from "./lms.service";

@Controller("courses")
export class LmsController {
  constructor(private readonly lmsService: LmsService) {}

  @Get()
  list() {
    return this.lmsService.listPublished();
  }

  // Public, like the list above: the syllabus is what convinces someone to
  // buy. Separate from the admin ":id" route further down because that one
  // returns every status and every field, including the Stream video ids.
  @Get("catalogue/:id")
  getPublished(@Param("id") id: string) {
    return this.lmsService.getPublishedCourse(id);
  }

  @Get("mine")
  @UseGuards(JwtAuthGuard, RolesGuard)
  listMine(@CurrentUser() user: RequestUser) {
    return this.lmsService.listMyEnrollments(user.id);
  }

  /**
   * Records progress on one module. The certificate is issued by the service
   * once every module is done — there is deliberately no endpoint that marks a
   * course complete directly, because that is the certificate's whole value.
   *
   * Ownership is enforced in the service against the token's user id, not
   * taken from the path, so one learner cannot report progress on another's
   * enrolment.
   */
  @Post("enrollments/:id/modules/:moduleId/complete")
  @UseGuards(JwtAuthGuard, RolesGuard)
  completeModule(
    @Param("id") enrollmentId: string,
    @Param("moduleId") moduleId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.lmsService.completeModule(enrollmentId, moduleId, user.id);
  }

  // Public — no guard. Anyone with a certificate ID can confirm it's real
  // (docs/srs.md Section 7, item 5).
  @Get("certificates/verify/:code")
  verify(@Param("code") code: string) {
    return this.lmsService.verifyCertificate(code);
  }

  // --- Admin course management (docs/implementation-plan.md Milestone 2) ---
  // Every literal path above is declared before ":id" below, so Nest's
  // in-order matching can't swallow "mine" or "certificates" as a course id.

  @Get("all")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  listAll() {
    return this.lmsService.listAll();
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  getById(@Param("id") id: string) {
    return this.lmsService.getById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  create(@Body() dto: UpsertCourseDto, @CurrentUser() user: RequestUser) {
    return this.lmsService.upsertCourse(dto, user.id);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  update(
    @Param("id") id: string,
    @Body() dto: UpsertCourseDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.lmsService.upsertCourse(dto, user.id, id);
  }

  @Put(":id/modules")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  replaceModules(
    @Param("id") id: string,
    @Body() dto: ReplaceModulesDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.lmsService.replaceModules(id, dto.modules, user.id);
  }
}
