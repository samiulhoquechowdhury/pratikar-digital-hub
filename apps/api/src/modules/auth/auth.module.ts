import { Module } from "@nestjs/common";

import { NotificationsModule } from "../notifications/notifications.module";
import { UsersModule } from "../users/users.module";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { GoogleAuthService } from "./google-auth.service";
import { OtpService } from "./otp.service";
import { SessionService } from "./session.service";

@Module({
  imports: [UsersModule, NotificationsModule], // JwtModule is registered globally in AppModule
  controllers: [AuthController],
  providers: [AuthService, OtpService, SessionService, GoogleAuthService],
  exports: [AuthService], // other modules (e.g. a future @CurrentUser guard) may need this
})
export class AuthModule {}
