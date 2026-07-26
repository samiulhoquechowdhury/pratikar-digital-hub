import { randomBytes } from "node:crypto";

import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class LmsService {
  constructor(private readonly prisma: PrismaService) {}

  listPublished() {
    return this.prisma.course.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
    });
  }

  /** Called by PaymentsService once a course order is confirmed paid. */
  async enroll(userId: string, courseId: string, orderId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException("COURSE_NOT_FOUND");

    return this.prisma.enrollment.create({
      data: {
        userId,
        courseId,
        orderId,
        expiresAt: new Date(Date.now() + course.accessDurationDays * 24 * 60 * 60 * 1000),
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
    const enrollment = await this.prisma.enrollment.findUnique({ where: { id: enrollmentId } });
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
      include: { enrollment: { include: { course: true, user: { select: { name: true } } } } },
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
