import {
  NotificationSender,
  staffAlertAddresses,
} from "./notification-sender.service";

describe("staffAlertAddresses", () => {
  it("reads a comma-separated list, tidied", () => {
    expect(
      staffAlertAddresses(
        " ops@pratikar.in, legal@pratikar.in ,ops@pratikar.in,",
      ),
    ).toEqual(["ops@pratikar.in", "legal@pratikar.in"]);
  });

  it("is empty when unset, so no alert goes anywhere unchosen", () => {
    expect(staffAlertAddresses("")).toEqual([]);
  });
});

describe("NotificationSender.sendToStaff", () => {
  const original = process.env.STAFF_ALERT_EMAILS;
  afterEach(() => {
    process.env.STAFF_ALERT_EMAILS = original;
  });

  it("queues one alert per address", async () => {
    process.env.STAFF_ALERT_EMAILS = "a@pratikar.in,b@pratikar.in";
    const queue = { add: jest.fn() };
    const sender = new NotificationSender(queue as never);

    await sender.sendToStaff((to) => ({
      type: "staff-review-requested",
      to,
      payload: { customerName: null, documentTitle: "Deed" },
    }));

    expect(queue.add).toHaveBeenCalledTimes(2);
    expect(
      queue.add.mock.calls.map(([, job]) => (job as { to: string }).to),
    ).toEqual(["a@pratikar.in", "b@pratikar.in"]);
  });
});
