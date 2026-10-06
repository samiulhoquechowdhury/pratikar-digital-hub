import { Injectable, Logger } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";

import type { EmailJob, SmsJob } from "./notification-dispatch.processor";
import { NotificationSender } from "./notification-sender.service";

/** An email job before it has an address — the notifier adds the user's. */
type EmailFor<J> = J extends { to: string } ? Omit<J, "to"> : never;

export interface UserNotification {
  /** Short: it is the push notification's title and the inbox entry's. */
  title: string;
  body: string;
  /** A path on the website — where tapping the notification goes. */
  href?: string;
  /** Also email it, rendered by this template. */
  email?: EmailFor<EmailJob>;
  /** Also text it, with this DLT template. Worth it for "it's ready" only. */
  sms?: SmsJob["payload"];
}

/** How many inbox entries a customer is shown. Older ones stay in the table. */
const INBOX_SIZE = 30;

/**
 * Tells a customer something happened, on every channel they can be reached:
 *
 *   in-app inbox  always — the bell in the site header; it is the record
 *   browser push  every browser they allowed notifications in
 *   email         when there is a template and an address
 *   SMS           when asked for and there is a phone number
 *
 * The inbox row is written first and directly; the rest go through the
 * notification queue so a slow provider never holds up the caller. Never
 * throws — every caller has already done the thing worth notifying about.
 */
@Injectable()
export class UserNotifier {
  private readonly logger = new Logger(UserNotifier.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sender: NotificationSender,
  ) {}

  async notifyUser(userId: string, n: UserNotification): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, phone: true },
      });
      if (!user) return;

      await this.prisma.notification.create({
        data: { userId, title: n.title, body: n.body, href: n.href ?? null },
      });

      await this.sender.send({
        type: "push",
        userId,
        payload: { title: n.title, body: n.body, href: n.href },
      });

      if (n.email && user.email) {
        await this.sender.send({ ...n.email, to: user.email });
      }
      if (n.sms && user.phone) {
        await this.sender.send({ type: "sms", to: user.phone, payload: n.sms });
      }
    } catch (error) {
      this.logger.error(
        `Could not notify ${userId} ("${n.title}"): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /** The newest inbox entries and how many are unread. */
  async inbox(userId: string) {
    const [items, unread] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: INBOX_SIZE,
        select: {
          id: true,
          title: true,
          body: true,
          href: true,
          readAt: true,
          createdAt: true,
        },
      }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);
    return { items, unread };
  }

  /** Marks the given entries read — or all of them, when none are named. */
  async markRead(userId: string, ids?: string[]): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
        ...(ids && ids.length > 0 ? { id: { in: ids } } : {}),
      },
      data: { readAt: new Date() },
    });
  }
}
