import { BadRequestException, NotFoundException } from "@nestjs/common";

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
