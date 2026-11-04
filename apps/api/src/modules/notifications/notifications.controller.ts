import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  UseGuards,
} from "@nestjs/common";

import {
  CurrentUser,
  type RequestUser,
} from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

import { AppPushService } from "./app-push.service";
import {
  AppPushForgetDto,
  AppPushTokenDto,
  MarkReadDto,
  PushSubscribeDto,
  PushUnsubscribeDto,
} from "./dto/notifications.dto";
import { UserNotifier } from "./user-notifier.service";
import { WebPushService } from "./web-push.service";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notifier: UserNotifier,
    private readonly push: WebPushService,
    private readonly appPush: AppPushService,
  ) {}

  /** The signed-in customer's inbox — the header bell. */
  @Get()
  inbox(@CurrentUser() user: RequestUser) {
    return this.notifier.inbox(user.id);
  }

  @Post("read")
  @HttpCode(200)
  async markRead(@CurrentUser() user: RequestUser, @Body() dto: MarkReadDto) {
    await this.notifier.markRead(user.id, dto.ids);
    return { ok: true };
  }

  /**
   * The VAPID public key a browser subscribes with. Public by design — it
   * identifies this server to the push services. Null when push is off, so
   * the site can hide the option instead of offering one that never fires.
   */
  @Get("push/key")
  @Public()
  pushKey() {
    return { publicKey: this.push.isConfigured ? this.push.publicKey : null };
  }

  @Post("push/subscribe")
  @HttpCode(200)
  async subscribe(
    @CurrentUser() user: RequestUser,
    @Body() dto: PushSubscribeDto,
    @Headers("user-agent") userAgent?: string,
  ) {
    await this.push.subscribe(user.id, dto, userAgent);
    return { ok: true };
  }

  @Post("push/unsubscribe")
  @HttpCode(200)
  async unsubscribe(
    @CurrentUser() user: RequestUser,
    @Body() dto: PushUnsubscribeDto,
  ) {
    await this.push.unsubscribe(user.id, dto.endpoint);
    return { ok: true };
  }

  /** The Android app, after sign-in and permission, registers its phone. */
  @Post("app-push/register")
  @HttpCode(200)
  async registerApp(
    @CurrentUser() user: RequestUser,
    @Body() dto: AppPushTokenDto,
  ) {
    await this.appPush.register(user.id, dto.token, dto.platform);
    return { ok: true };
  }

  /** And forgets it on sign-out, so the next account on the phone isn't told. */
  @Post("app-push/unregister")
  @HttpCode(200)
  async unregisterApp(
    @CurrentUser() user: RequestUser,
    @Body() dto: AppPushForgetDto,
  ) {
    await this.appPush.unregister(user.id, dto.token);
    return { ok: true };
  }
}
