import { Controller, Get, Param, Post, UseGuards } from "@nestjs/common";

import {
  CurrentUser,
  type RequestUser,
} from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";

import { LmsService } from "./lms.service";

@Controller("courses")
export class LmsController {
  constructor(private readonly lmsService: LmsService) {}

  @Get()
  list() {
    return this.lmsService.listPublished();
  }

  @Get("mine")
  @UseGuards(JwtAuthGuard, RolesGuard)
  listMine(@CurrentUser() user: RequestUser) {
    return this.lmsService.listMyEnrollments(user.id);
  }

  @Post("enrollments/:id/complete")
  @UseGuards(JwtAuthGuard, RolesGuard)
  complete(@Param("id") enrollmentId: string) {
    // TODO: this should be triggered by actual progress tracking (all
    // CourseModules watched), not callable directly by the client — revisit
    // once module-level progress exists.
    return this.lmsService.markComplete(enrollmentId);
  }

  // Public — no guard. Anyone with a certificate ID can confirm it's real
  // (docs/srs.md Section 7, item 5).
  @Get("certificates/verify/:code")
  verify(@Param("code") code: string) {
    return this.lmsService.verifyCertificate(code);
  }
}
