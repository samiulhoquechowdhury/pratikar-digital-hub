import { randomBytes } from "node:crypto";

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import {
  AuditAction,
  AuditService,
  AuditTargetType,
} from "../audit/audit.service";

import type { CourseModuleDto } from "./dto/replace-modules.dto";
import type { UpsertCourseDto } from "./dto/upsert-course.dto";

@Injectable()
export class LmsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listPublished() {
    return this.prisma.course.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
    });
  }

  /** Every status, with module counts — the admin course list. */
  listAll() {
    return this.prisma.course.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { modules: true, enrollments: true } } },
    });
  }

  async getById(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { modules: { orderBy: { order: "asc" } } },
    });
    if (!course) throw new NotFoundException("COURSE_NOT_FOUND");
    return course;
  }

  async upsertCourse(
    dto: UpsertCourseDto,
    actorUserId: string,
    courseId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      if (courseId) {
        const existing = await tx.course.findUnique({
          where: { id: courseId },
        });
        if (!existing) throw new NotFoundException("COURSE_NOT_FOUND");

        const updated = await tx.course.update({
          where: { id: courseId },
          data: dto,
        });

        await this.audit.recordWith(tx, {
          actorUserId,
          action: AuditAction.COURSE_UPDATED,
          targetType: AuditTargetType.COURSE,
          targetId: updated.id,
          metadata: {
            title: updated.title,
            statusFrom: existing.status,
            statusTo: updated.status,
            // Access duration changes only affect enrolments created after
            // them — existing rows carry an already-computed expiresAt — so
            // record the change to make that visible during a dispute.
            accessDurationFrom: existing.accessDurationDays,
            accessDurationTo: updated.accessDurationDays,
          },
        });

        return updated;
      }

      const created = await tx.course.create({ data: dto });

      await this.audit.recordWith(tx, {
        actorUserId,
        action: AuditAction.COURSE_CREATED,
        targetType: AuditTargetType.COURSE,
        targetId: created.id,
        metadata: { title: created.title, status: created.status },
      });

      return created;
    });
  }

  /**
   * Replaces the module list wholesale (see ReplaceModulesDto for why).
   * Rejects duplicate positions: `order` drives playback sequence, and two
   * modules sharing a position would order non-deterministically.
   */
  async replaceModules(
    courseId: string,
    modules: CourseModuleDto[],
    actorUserId: string,
  ) {
    const positions = modules.map((m) => m.order);
    if (new Set(positions).size !== positions.length) {
      throw new BadRequestException("DUPLICATE_MODULE_ORDER");
    }

    return this.prisma.$transaction(async (tx) => {
      const course = await tx.course.findUnique({ where: { id: courseId } });
      if (!course) throw new NotFoundException("COURSE_NOT_FOUND");

      await tx.courseModule.deleteMany({ where: { courseId } });
      if (modules.length > 0) {
        await tx.courseModule.createMany({
          data: modules.map((m) => ({ ...m, courseId })),
        });
      }

      await this.audit.recordWith(tx, {
        actorUserId,
        action: AuditAction.COURSE_MODULES_REPLACED,
        targetType: AuditTargetType.COURSE,
        targetId: courseId,
        metadata: { moduleCount: modules.length },
      });

      return tx.courseModule.findMany({
        where: { courseId },
        orderBy: { order: "asc" },
      });
    });
  }

  /** Called by PaymentsService once a course order is confirmed paid. */
  async enroll(userId: string, courseId: string, orderId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) throw new NotFoundException("COURSE_NOT_FOUND");

    return this.prisma.enrollment.create({
      data: {
        userId,
        courseId,
        orderId,
        expiresAt: new Date(
          Date.now() + course.accessDurationDays * 24 * 60 * 60 * 1000,
        ),
      },
    });
  }

  listMyEnrollments(userId: string) {
    return this.prisma.enrollment.findMany({
      where: { userId },
      include: { course: true, certificate: true },
      orderBy: { enrolledAt: "desc" },
    });
  }

  /**
   * Confirmed policy (docs/srs.md Section 7, item 2): after the 6-month
   * window, the customer keeps the certificate but loses video access —
   * enforced here by checking expiresAt before allowing content access, NOT
   * by revoking the Enrollment or Certificate rows themselves.
   */
  async assertVideoAccess(enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    });
    if (!enrollment) throw new NotFoundException("ENROLLMENT_NOT_FOUND");
    return enrollment.expiresAt > new Date();
  }

  async markComplete(enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { completedAt: new Date() },
    });

    const verificationCode = randomBytes(8).toString("hex");
    return this.prisma.certificate.create({
      data: { enrollmentId: enrollment.id, verificationCode },
    });
  }

  /** Public endpoint (docs/srs.md Section 7, item 5) — no auth required. */
  async verifyCertificate(verificationCode: string) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { verificationCode },
      include: {
        enrollment: {
          include: { course: true, user: { select: { name: true } } },
        },
      },
    });
    if (!certificate) return { valid: false };

    return {
      valid: true,
      courseTitle: certificate.enrollment.course.title,
      holderName: certificate.enrollment.user.name,
      issuedAt: certificate.issuedAt,
    };
  }
}
