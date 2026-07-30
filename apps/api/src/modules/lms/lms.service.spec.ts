import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";

import type { PrismaService } from "../../prisma/prisma.service";
import {
  AuditAction,
  AuditService,
  AuditTargetType,
} from "../audit/audit.service";

import type { CourseModuleDto } from "./dto/replace-modules.dto";
import type { UpsertCourseDto } from "./dto/upsert-course.dto";
import { LmsService } from "./lms.service";

describe("LmsService course management", () => {
  const dto: UpsertCourseDto = {
    title: "GST for Freelancers",
    priceInPaise: 249900,
    accessDurationDays: 180,
    status: "DRAFT",
  };

  const buildPrisma = () => {
    const tx = {
      course: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn() },
      courseModule: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      auditLog: { create: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn((cb: (client: typeof tx) => unknown) => cb(tx)),
    };
    return { prisma, tx };
  };

  const buildService = (prisma: unknown) =>
    new LmsService(
      prisma as PrismaService,
      new AuditService(prisma as PrismaService),
    );

  it("audits course creation", async () => {
    const { prisma, tx } = buildPrisma();
    tx.course.create.mockResolvedValue({
      id: "c-1",
      title: dto.title,
      status: "DRAFT",
    });

    await buildService(prisma).upsertCourse(dto, "cm-1");

    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorUserId: "cm-1",
        action: AuditAction.COURSE_CREATED,
        targetType: AuditTargetType.COURSE,
        targetId: "c-1",
        metadata: { title: dto.title, status: "DRAFT" },
      },
    });
  });

  /**
   * Access duration only applies to future enrolments — existing rows carry an
   * already-computed expiresAt — so a change here is exactly the kind of thing
   * a "why did my access end early?" dispute needs on record.
   */
  it("records access-duration changes on update", async () => {
    const { prisma, tx } = buildPrisma();
    tx.course.findUnique.mockResolvedValue({
      id: "c-1",
      status: "DRAFT",
      accessDurationDays: 180,
    });
    tx.course.update.mockResolvedValue({
      id: "c-1",
      title: dto.title,
      status: "PUBLISHED",
      accessDurationDays: 365,
    });

    await buildService(prisma).upsertCourse(
      { ...dto, status: "PUBLISHED", accessDurationDays: 365 },
      "cm-1",
      "c-1",
    );

    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorUserId: "cm-1",
        action: AuditAction.COURSE_UPDATED,
        targetType: AuditTargetType.COURSE,
        targetId: "c-1",
        metadata: {
          title: dto.title,
          statusFrom: "DRAFT",
          statusTo: "PUBLISHED",
          accessDurationFrom: 180,
          accessDurationTo: 365,
        },
      },
    });
  });

  it("rejects an update to a missing course without logging one", async () => {
    const { prisma, tx } = buildPrisma();
    tx.course.findUnique.mockResolvedValue(null);

    await expect(
      buildService(prisma).upsertCourse(dto, "cm-1", "ghost"),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(tx.auditLog.create).not.toHaveBeenCalled();
  });

  describe("replaceModules", () => {
    const modules: CourseModuleDto[] = [
      { title: "Intro", order: 0, videoAssetId: "vid-1" },
      { title: "Filing", order: 1, videoAssetId: "vid-2" },
    ];

    it("replaces the whole list and audits the new count", async () => {
      const { prisma, tx } = buildPrisma();
      tx.course.findUnique.mockResolvedValue({ id: "c-1" });

      await buildService(prisma).replaceModules("c-1", modules, "cm-1");

      expect(tx.courseModule.deleteMany).toHaveBeenCalledWith({
        where: { courseId: "c-1" },
      });
      expect(tx.courseModule.createMany).toHaveBeenCalledWith({
        data: [
          { title: "Intro", order: 0, videoAssetId: "vid-1", courseId: "c-1" },
          { title: "Filing", order: 1, videoAssetId: "vid-2", courseId: "c-1" },
        ],
      });
      expect(tx.auditLog.create).toHaveBeenCalledWith({
        data: expect.anything() as never,
      });
    });

    // Two modules sharing a position would order non-deterministically in
    // playback, so this is rejected before anything is deleted.
    it("rejects duplicate positions before touching existing modules", async () => {
      const { prisma, tx } = buildPrisma();

      await expect(
        buildService(prisma).replaceModules(
          "c-1",
          [
            { title: "A", order: 0, videoAssetId: "v1" },
            { title: "B", order: 0, videoAssetId: "v2" },
          ],
          "cm-1",
        ),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(tx.courseModule.deleteMany).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("allows clearing every module", async () => {
      const { prisma, tx } = buildPrisma();
      tx.course.findUnique.mockResolvedValue({ id: "c-1" });

      await buildService(prisma).replaceModules("c-1", [], "cm-1");

      expect(tx.courseModule.deleteMany).toHaveBeenCalled();
      expect(tx.courseModule.createMany).not.toHaveBeenCalled();
    });

    it("rejects modules for a course that doesn't exist", async () => {
      const { prisma, tx } = buildPrisma();
      tx.course.findUnique.mockResolvedValue(null);

      await expect(
        buildService(prisma).replaceModules("ghost", modules, "cm-1"),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(tx.courseModule.deleteMany).not.toHaveBeenCalled();
    });
  });
});

/**
 * A certificate is what the public verification page vouches for to an
 * employer, so the rules that decide when one gets issued matter more than
 * anything else in this service. The endpoint this replaced had no ownership
 * check at all and minted a certificate on request.
 */
describe("LmsService.completeModule", () => {
  const MODULES = [{ id: "mod-1" }, { id: "mod-2" }];
  const future = new Date(Date.now() + 86_400_000);
  const past = new Date(Date.now() - 86_400_000);

  const enrollment = (overrides: Record<string, unknown> = {}) => ({
    id: "enr-1",
    userId: "learner-1",
    completedAt: null,
    expiresAt: future,
    course: { modules: MODULES },
    certificate: null,
    progress: [],
    ...overrides,
  });

  const build = (
    opts: {
      found?: unknown;
      /** How many of the course's modules have progress rows after the upsert. */
      completedCount?: number;
      /** 0 when a concurrent completion already claimed the enrolment. */
      claimCount?: number;
    } = {},
  ) => {
    const { found = enrollment(), completedCount = 1, claimCount = 1 } = opts;
    const tx = {
      enrollment: {
        updateMany: jest.fn().mockResolvedValue({ count: claimCount }),
      },
      certificate: { create: jest.fn().mockResolvedValue({ id: "cert-1" }) },
    };
    const prisma = {
      enrollment: { findUnique: jest.fn().mockResolvedValue(found) },
      moduleProgress: {
        upsert: jest.fn(),
        count: jest.fn().mockResolvedValue(completedCount),
      },
      $transaction: jest.fn((cb: (client: typeof tx) => unknown) => cb(tx)),
    };
    const service = new LmsService(
      prisma as unknown as PrismaService,
      new AuditService(prisma as unknown as PrismaService),
    );
    return { service, prisma, tx };
  };

  it("records progress without issuing a certificate mid-course", async () => {
    const { service, prisma, tx } = build({ completedCount: 1 });

    await service.completeModule("enr-1", "mod-1", "learner-1");

    expect(prisma.moduleProgress.upsert).toHaveBeenCalled();
    expect(tx.certificate.create).not.toHaveBeenCalled();
  });

  it("issues the certificate once every module is finished", async () => {
    const { service, tx } = build({ completedCount: 2 });

    await service.completeModule("enr-1", "mod-2", "learner-1");

    expect(tx.enrollment.updateMany).toHaveBeenCalledWith({
      where: { id: "enr-1", completedAt: null },
      data: { completedAt: expect.any(Date) as Date },
    });
    expect(tx.certificate.create).toHaveBeenCalled();
  });

  /**
   * The hole this replaced: any signed-in user could mint a certificate
   * against an enrolment that wasn't theirs.
   */
  it("refuses to record progress on someone else's enrolment", async () => {
    const { service, prisma } = build();

    await expect(
      service.completeModule("enr-1", "mod-1", "attacker-9"),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.moduleProgress.upsert).not.toHaveBeenCalled();
  });

  it("refuses once the access window has closed", async () => {
    const { service, prisma } = build({
      found: enrollment({ expiresAt: past }),
    });

    await expect(
      service.completeModule("enr-1", "mod-1", "learner-1"),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.moduleProgress.upsert).not.toHaveBeenCalled();
  });

  /**
   * Otherwise progress on a course the learner did buy could be reported
   * against a different course's enrolment and complete it.
   */
  it("rejects a module that belongs to another course", async () => {
    const { service, prisma } = build();

    await expect(
      service.completeModule("enr-1", "mod-from-elsewhere", "learner-1"),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.moduleProgress.upsert).not.toHaveBeenCalled();
  });

  /** A course with no modules would otherwise be vacuously complete. */
  it("never certifies a course that has no modules", async () => {
    const { service, tx } = build({
      found: enrollment({ course: { modules: [] } }),
      completedCount: 0,
    });

    await expect(
      service.completeModule("enr-1", "mod-1", "learner-1"),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(tx.certificate.create).not.toHaveBeenCalled();
  });

  it("does not issue a second certificate for an already-completed course", async () => {
    const { service, tx } = build({
      found: enrollment({ completedAt: new Date() }),
      completedCount: 2,
    });

    await service.completeModule("enr-1", "mod-2", "learner-1");

    expect(tx.certificate.create).not.toHaveBeenCalled();
  });

  /**
   * Two concurrent reports of the final module both see a finished course.
   * Only the one that wins the conditional update may create the certificate —
   * a second would hit the unique constraint on enrollmentId.
   */
  it("lets only one of two concurrent completions create the certificate", async () => {
    const { service, tx } = build({ completedCount: 2, claimCount: 0 });

    await service.completeModule("enr-1", "mod-2", "learner-1");

    expect(tx.certificate.create).not.toHaveBeenCalled();
  });

  it("is idempotent when the same module is reported twice", async () => {
    const { service, prisma } = build({ completedCount: 1 });

    await service.completeModule("enr-1", "mod-1", "learner-1");

    // upsert with an empty update: a repeat playback event must not error or
    // create a duplicate row.
    expect(prisma.moduleProgress.upsert).toHaveBeenCalledWith({
      where: {
        enrollmentId_moduleId: { enrollmentId: "enr-1", moduleId: "mod-1" },
      },
      create: { enrollmentId: "enr-1", moduleId: "mod-1" },
      update: {},
    });
  });
});
