import type { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

import { LmsService } from "./lms.service";

const NOW = new Date("2026-10-07T04:30:00Z");

describe("LmsService.sendExpiryReminders", () => {
  const due = (overrides: Record<string, unknown> = {}) => ({
    id: "enr-1",
    expiresAt: new Date("2026-10-12T00:00:00Z"),
    user: { name: "Asha", email: "asha@example.com" },
    course: { title: "GST for Freelancers", _count: { modules: 4 } },
    _count: { progress: 1 },
    ...overrides,
  });

  const build = (rows: unknown[], claimCount = 1) => {
    const prisma = {
      enrollment: {
        findMany: jest.fn().mockResolvedValue(rows),
        updateMany: jest.fn().mockResolvedValue({ count: claimCount }),
      },
    };
    const notifications = { send: jest.fn() };
    const service = new LmsService(
      prisma as unknown as PrismaService,
      new AuditService(prisma as unknown as PrismaService),
      { reindex: jest.fn() } as never,
      notifications as never,
    );
    return { service, prisma, notifications };
  };

  it("asks only for unfinished, unreminded courses ending within a week", async () => {
    const { service, prisma } = build([]);

    await service.sendExpiryReminders(NOW);

    const query = (
      prisma.enrollment.findMany.mock.calls[0] as [
        { where: Record<string, unknown> },
      ]
    )[0];
    expect(query.where).toEqual({
      completedAt: null,
      expiryReminderSentAt: null,
      expiresAt: {
        gt: NOW,
        lte: new Date("2026-10-14T04:30:00Z"),
      },
    });
  });

  it("claims each enrolment before emailing it, with its progress", async () => {
    const { service, prisma, notifications } = build([due()]);

    await expect(service.sendExpiryReminders(NOW)).resolves.toEqual({
      due: 1,
      sent: 1,
    });

    expect(prisma.enrollment.updateMany).toHaveBeenCalledWith({
      where: { id: "enr-1", expiryReminderSentAt: null },
      data: { expiryReminderSentAt: NOW },
    });
    expect(notifications.send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "course-expiring",
        to: "asha@example.com",
        payload: expect.objectContaining({
          courseTitle: "GST for Freelancers",
          progress: { done: 1, total: 4 },
        }) as unknown,
      }),
    );
  });

  // Two runs at once, or a retried run: the claim lets only one send.
  it("sends nothing for an enrolment another run already claimed", async () => {
    const { service, notifications } = build([due()], 0);

    await expect(service.sendExpiryReminders(NOW)).resolves.toEqual({
      due: 1,
      sent: 0,
    });
    expect(notifications.send).not.toHaveBeenCalled();
  });

  it("skips a learner with no email, but still marks them reminded", async () => {
    const { service, prisma, notifications } = build([
      due({ user: { name: null, email: null } }),
    ]);

    await service.sendExpiryReminders(NOW);

    expect(prisma.enrollment.updateMany).toHaveBeenCalled();
    expect(notifications.send).not.toHaveBeenCalled();
  });
});
