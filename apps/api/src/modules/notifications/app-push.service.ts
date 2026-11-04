import { Injectable, Logger, Optional } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import {
  IntegrationsService,
  liveSetting,
} from "../integrations/integrations.service";

import type { PushMessage } from "./web-push.service";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
/** Expo takes up to 100 messages per request. */
const BATCH = 100;

interface ExpoTicket {
  status: "ok" | "error";
  message?: string;
  details?: { error?: string };
}

/**
 * Push notifications to the Android app, through Expo's push service —
 * which delivers through Firebase Cloud Messaging, so the app needs its
 * FCM credentials uploaded to Expo (EAS) for production builds. The API
 * needs nothing but the tokens; EXPO_ACCESS_TOKEN is used when set, for
 * accounts that turn on push security.
 *
 * The browser's counterpart is WebPushService; the dispatcher sends a
 * "push" job to both.
 */
@Injectable()
export class AppPushService {
  private readonly logger = new Logger(AppPushService.name);
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly integrations?: IntegrationsService,
  ) {}

  private get accessToken() {
    return liveSetting(this.integrations, "EXPO_ACCESS_TOKEN");
  }

  /** Upserted on the token: a phone re-registering, or a new account on it, replaces the row. */
  async register(
    userId: string,
    token: string,
    platform: string,
  ): Promise<void> {
    await this.prisma.appPushToken.upsert({
      where: { token },
      create: { userId, token, platform },
      update: { userId, platform },
    });
  }

  /** Scoped to the user, so nobody can unregister someone else's phone. */
  async unregister(userId: string, token: string): Promise<void> {
    await this.prisma.appPushToken.deleteMany({ where: { userId, token } });
  }

  /**
   * Sends to every phone the user has the app on. Returns how many Expo
   * accepted. Throws only when every attempt failed for a reason worth
   * retrying, so the queue tries again later.
   */
  async sendToUser(userId: string, message: PushMessage): Promise<number> {
    const tokens = await this.prisma.appPushToken.findMany({
      where: { userId },
      select: { id: true, token: true },
    });
    if (tokens.length === 0) return 0;

    let delivered = 0;
    let retryable = 0;
    for (let i = 0; i < tokens.length; i += BATCH) {
      const batch = tokens.slice(i, i + BATCH);
      let tickets: ExpoTicket[];
      try {
        const res = await fetch(EXPO_PUSH_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(this.accessToken
              ? { Authorization: `Bearer ${this.accessToken}` }
              : {}),
          },
          body: JSON.stringify(
            batch.map(({ token }) => ({
              to: token,
              title: message.title,
              body: message.body,
              // The app maps this website path to its own screen.
              data: message.href ? { href: message.href } : {},
              sound: "default",
              priority: "high",
              channelId: "default",
              // A day, as for browsers: after that it's old news.
              ttl: 24 * 3600,
            })),
          ),
        });
        if (!res.ok) throw new Error(`Expo push answered ${res.status}`);
        tickets = ((await res.json()) as { data: ExpoTicket[] }).data;
      } catch (error) {
        retryable += batch.length;
        this.logger.warn(`App push failed: ${(error as Error).message}`);
        continue;
      }

      const gone: string[] = [];
      tickets.forEach((ticket, index) => {
        if (ticket.status === "ok") {
          delivered += 1;
        } else if (ticket.details?.error === "DeviceNotRegistered") {
          // Uninstalled, or notifications turned off for good: it will
          // never work again, so it goes.
          gone.push(batch[index]!.id);
        } else {
          retryable += 1;
          this.logger.warn(
            `App push to ${batch[index]!.id} refused: ${ticket.details?.error ?? ticket.message ?? "unknown"}`,
          );
        }
      });
      if (gone.length > 0) {
        await this.prisma.appPushToken.deleteMany({
          where: { id: { in: gone } },
        });
      }
    }

    if (delivered === 0 && retryable > 0) {
      throw new Error(`App push failed for all ${retryable} devices`);
    }
    return delivered;
  }
}
