import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlerModule } from "@nestjs/throttler";

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
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_ACCESS_SECRET ?? "dev-only-secret-change-me",
      signOptions: { expiresIn: "15m" },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 20, // global default; auth endpoints override with a stricter limit
      },
    ]),
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
  ],
})
export class AppModule {}
