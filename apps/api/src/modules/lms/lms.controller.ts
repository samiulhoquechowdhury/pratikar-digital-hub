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
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";

import { SaveAnswerDto, StartAttemptDto } from "./dto/quiz-attempt.dto";
import { ReplaceModulesDto } from "./dto/replace-modules.dto";
import { UpsertCourseDto } from "./dto/upsert-course.dto";
import { UpsertQuizDto } from "./dto/upsert-quiz.dto";
import { LmsService } from "./lms.service";
import { QuizService } from "./quiz.service";

@Controller("courses")
export class LmsController {
  constructor(
    private readonly lmsService: LmsService,
    private readonly quizService: QuizService,
  ) {}

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

  /**
   * The gated lesson plan for one enrolment: which modules are open, what's
   * been watched, what each quiz scored. Everything the lesson player needs
   * to draw the sequence, decided server-side.
   */
  @Get("enrollments/:id/outline")
  @UseGuards(JwtAuthGuard, RolesGuard)
  outline(@Param("id") enrollmentId: string, @CurrentUser() user: RequestUser) {
    return this.lmsService.getLearnerOutline(enrollmentId, user.id);
  }

  // --- Taking a quiz -------------------------------------------------------
  // Every one of these re-checks ownership, the access window, and the
  // video-before-test gate in the service. The outline above says what the UI
  // should show; these say what's actually allowed.

  @Post("quizzes/:quizId/attempts")
  @UseGuards(JwtAuthGuard, RolesGuard)
  startAttempt(
    @Param("quizId") quizId: string,
    @Body() dto: StartAttemptDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.quizService.startAttempt(quizId, dto.enrollmentId, user.id);
  }

  /**
   * Saves one answer as the learner goes, rather than posting the lot at the
   * end — so a timer running out costs the unanswered questions and nothing
   * that was already decided.
   */
  @Put("attempts/:attemptId/answers")
  @UseGuards(JwtAuthGuard, RolesGuard)
  saveAnswer(
    @Param("attemptId") attemptId: string,
    @Body() dto: SaveAnswerDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.quizService.saveAnswer(
      attemptId,
      dto.questionId,
      dto.selectedOptionId ?? null,
      user.id,
    );
  }

  @Post("attempts/:attemptId/submit")
  @UseGuards(JwtAuthGuard, RolesGuard)
  submitAttempt(
    @Param("attemptId") attemptId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.quizService.submitAttempt(attemptId, user.id);
  }

  // Public — no guard. Anyone with a certificate ID can confirm it's real
  // (docs/srs.md Section 7, item 5). This is what the QR code on a printed
  // certificate resolves to.
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

/**
 * Quiz authoring, on its own controller so the answer key sits behind a
 * route prefix that has staff roles on the class rather than per-method.
 * Every response here contains QuizOption.isCorrect — that is the one thing
 * that must never reach a learner, and a single misplaced decorator on the
 * course controller would be enough to leak it.
 */
@Controller("modules")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CONTENT_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
export class QuizAdminController {
  constructor(private readonly quizService: QuizService) {}

  @Get(":moduleId/quiz")
  get(@Param("moduleId") moduleId: string) {
    return this.quizService.getQuizForAdmin(moduleId);
  }

  @Put(":moduleId/quiz")
  upsert(
    @Param("moduleId") moduleId: string,
    @Body() dto: UpsertQuizDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.quizService.upsertQuiz(moduleId, dto, user.id);
  }

  @Delete(":moduleId/quiz")
  @HttpCode(204)
  remove(@Param("moduleId") moduleId: string) {
    return this.quizService.deleteQuiz(moduleId);
  }
}
