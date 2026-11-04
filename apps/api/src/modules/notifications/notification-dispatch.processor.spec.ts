import type { Job } from "bullmq";

import type { AppPushService } from "./app-push.service";
import {
  NotificationDispatchProcessor,
  type NotificationJob,
} from "./notification-dispatch.processor";
import type { NotificationsService } from "./notifications.service";
import type { SmsService } from "./sms.service";
import type { WebPushService } from "./web-push.service";

const pushJob = {
  data: {
    type: "push",
    userId: "u1",
    payload: { title: "Ready", body: "Your document is ready" },
  },
} as Job<NotificationJob>;

const build = (browsers: Promise<number>, phones: Promise<number>) => {
  const web = { sendToUser: jest.fn().mockReturnValue(browsers) };
  const app = { sendToUser: jest.fn().mockReturnValue(phones) };
  const processor = new NotificationDispatchProcessor(
    {} as NotificationsService,
    web as unknown as WebPushService,
    app as unknown as AppPushService,
    {} as SmsService,
  );
  return { processor, web, app };
};

describe("NotificationDispatchProcessor — push", () => {
  it("sends to browsers and phones alike", async () => {
    const { processor, web, app } = build(
      Promise.resolve(1),
      Promise.resolve(2),
    );
    await processor.process(pushJob);
    expect(web.sendToUser).toHaveBeenCalledWith("u1", pushJob.data.payload);
    expect(app.sendToUser).toHaveBeenCalledWith("u1", pushJob.data.payload);
  });

  it("doesn't retry when one channel got through — that would notify twice", async () => {
    const { processor } = build(
      Promise.reject(new Error("browsers down")),
      Promise.resolve(1),
    );
    await expect(processor.process(pushJob)).resolves.toBeUndefined();
  });

  it("retries when nothing got through", async () => {
    const { processor } = build(
      Promise.resolve(0),
      Promise.reject(new Error("Expo down")),
    );
    await expect(processor.process(pushJob)).rejects.toThrow("Expo down");
  });

  it("is quiet for someone with no devices at all", async () => {
    const { processor } = build(Promise.resolve(0), Promise.resolve(0));
    await expect(processor.process(pushJob)).resolves.toBeUndefined();
  });
});
