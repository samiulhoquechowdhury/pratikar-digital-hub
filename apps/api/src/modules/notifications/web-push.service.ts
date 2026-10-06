import { Injectable, Logger } from "@nestjs/common";
import webpush from "web-push";

import { PrismaService } from "../../prisma/prisma.service";

/** What a push notification shows, and where tapping it goes. */
export interface PushMessage {
  title: string;
  body: string;
  /** A path on the website, e.g. /dashboard/documents/<id>. */
  href?: string;
}

/** A browser's subscription, as PushManager.subscribe() returns it. */
export interface BrowserSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/**
 * Browser push notifications (the Web Push API, signed with VAPID).
 *
 * This is how a web app gets the notification an installed app would: the
 * browser registers with its vendor's push service (Google's for Chrome and
 * Android, Apple's for Safari, Mozilla's for Firefox), we store the address
 * it was given, and a message posted there reaches the device even with the
 * site closed. The service worker in apps/web/public/sw.js shows it.
 *
 * Without VAPID keys this does nothing, and says so once at boot — the
 * in-app inbox, email and SMS carry on regardless.
 */
@Injectable()
export class WebPushService {
  private readonly logger = new Logger(WebPushService.name);
  readonly publicKey = process.env.VAPID_PUBLIC_KEY ?? "";
  private readonly configured: boolean;

  constructor(private readonly prisma: PrismaService) {
    const privateKey = process.env.VAPID_PRIVATE_KEY ?? "";
    this.configured = Boolean(this.publicKey && privateKey);
    if (this.configured) {
      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || "mailto:support@pratikar.in",
        this.publicKey,
        privateKey,
      );
    } else {
      this.logger.warn("VAPID keys not set — browser push is off.");
    }
  }

  get isConfigured(): boolean {
    return this.configured;
  }

  /**
   * Saves a browser's subscription for this user. Upserted on the endpoint:
   * the same browser subscribing again — or someone else signing in on it —
   * replaces the row rather than adding a second one that would notify twice.
   */
  async subscribe(
    userId: string,
    subscription: BrowserSubscription,
    userAgent?: string,
  ): Promise<void> {
    const data = {
      userId,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent: userAgent?.slice(0, 300) ?? null,
    };
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      create: { endpoint: subscription.endpoint, ...data },
      update: data,
    });
  }

  /** Forgets a browser. Scoped to the user, so nobody can unsubscribe another. */
  async unsubscribe(userId: string, endpoint: string): Promise<void> {
    await this.prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });
  }

  /**
   * Sends to every browser the user has subscribed. Returns how many it
   * reached. Throws only when every attempt failed for a reason worth
   * retrying, so the queue tries again later.
   */
  async sendToUser(userId: string, message: PushMessage): Promise<number> {
    if (!this.configured) return 0;

    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });
    const payload = JSON.stringify(message);

    let delivered = 0;
    let retryable = 0;
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
          // A day: after that "your document is ready" is old news, and the
          // inbox and email have it anyway.
          { TTL: 24 * 3600, urgency: "high" },
        );
        delivered += 1;
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          // The browser unsubscribed, or the subscription expired. It will
          // never work again, so it goes.
          await this.prisma.pushSubscription.delete({ where: { id: sub.id } });
        } else {
          retryable += 1;
          this.logger.warn(
            `Push to ${sub.id} failed (${status ?? "network"}): ${(error as Error).message}`,
          );
        }
      }
    }

    if (delivered === 0 && retryable > 0) {
      throw new Error(`Push failed for all ${retryable} browsers`);
    }
    return delivered;
  }
}
