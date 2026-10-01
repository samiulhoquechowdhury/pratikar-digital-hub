import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlerModule } from "@nestjs/throttler";
import { SentryGlobalFilter, SentryModule } from "@sentry/nestjs/setup";

import {
  THROTTLER_OPTIONS,
  throttlerGuardProvider,
} from "./common/http/throttling";
import { ChatModule } from "./modules/ai/chat/chat.module";
import { DocumentFillModule } from "./modules/ai/document-fill/document-fill.module";
import { KnowledgeBaseModule } from "./modules/ai/knowledge-base/knowledge-base.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ContentLibraryModule } from "./modules/content-library/content-library.module";
import { DocumentsModule } from "./modules/documents/documents.module";
import { LmsModule } from "./modules/lms/lms.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { StorageModule } from "./modules/storage/storage.module";
import { UsersModule } from "./modules/users/users.module";
import { PrismaModule } from "./prisma/prisma.module";

// As each module (documents, payments, content-library, lms, admin,
// notifications, ai) gets built out, it gets registered here — this is the
// single map of "what's actually wired up" vs. the folder skeleton.
@Module({
  imports: [
    // First, per Sentry's setup, so it wraps everything registered after it.
    // Does nothing when SENTRY_DSN is unset (see instrument.ts).
    SentryModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_ACCESS_SECRET ?? "dev-only-secret-change-me",
      signOptions: { expiresIn: "15m" },
    }),
    ThrottlerModule.forRoot(THROTTLER_OPTIONS),
    BullModule.forRoot({
      connection: { url: process.env.REDIS_URL ?? "redis://localhost:6379" },
    }),
    AuthModule,
    UsersModule,
    DocumentsModule,
    ContentLibraryModule,
    LmsModule,
    PaymentsModule,
    NotificationsModule,
    StorageModule,
    KnowledgeBaseModule,
    ChatModule,
    DocumentFillModule,
  ],
  providers: [
    throttlerGuardProvider,
    // Reports unexpected errors only — anything that isn't an HttpException —
    // so a 404, a validation failure or a rate limit is never sent as a bug.
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
  ],
})
export class AppModule {}
