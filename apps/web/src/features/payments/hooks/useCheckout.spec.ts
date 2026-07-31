import { act, renderHook, waitFor } from "@testing-library/react";

import { paymentsApi } from "../api/paymentsApi";
import { openCheckout } from "../lib/razorpayCheckout";

import { useCheckout } from "./useCheckout";

jest.mock("../api/paymentsApi");
jest.mock("../lib/razorpayCheckout");

const mockedApi = jest.mocked(paymentsApi);
const mockedOpenCheckout = jest.mocked(openCheckout);

/**
 * This hook decides whether to tell a customer they have paid. Getting that
 * wrong in either direction is expensive: claiming success on a failed capture
 * hands over the goods for free, and claiming failure on a successful one tells
 * someone their money vanished. Razorpay's widget is not the authority — only
 * the signed webhook our API receives is — so the gap between the two is what
 * most of these tests are about.
 */
describe("useCheckout", () => {
  const ORDER = {
    id: "ord-1",
    itemType: "COURSE" as const,
    amount: 249900,
    gstAmount: 44982,
    status: "PENDING",
    razorpayOrderId: "order_rzp_1",
  };

  /** An order row as GET /orders/mine returns it. */
  const orderWithStatus = (status: string) =>
    [{ ...ORDER, status }] as unknown as Awaited<
      ReturnType<typeof paymentsApi.listMine>
    >;

  /** Captures the callbacks the hook hands to the Razorpay widget. */
  let widget: Parameters<typeof openCheckout>[0];

  beforeEach(() => {
    jest.useFakeTimers();
    mockedApi.createOrder.mockResolvedValue(ORDER);
    mockedApi.listMine.mockResolvedValue(orderWithStatus("PENDING"));
    mockedOpenCheckout.mockImplementation((params) => {
      widget = params;
      return Promise.resolve();
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  /**
   * Advances the poll clock and lets the promises it resolves settle. The
   * await matters: advancing timers only schedules the next fetch, so without
   * flushing microtasks the assertions run before the poll has answered.
   */
  const tick = async (ms: number) => {
    await act(async () => {
      jest.advanceTimersByTime(ms);
      await Promise.resolve();
    });
  };

  const startPurchase = async () => {
    const view = renderHook(() => useCheckout());
    await act(async () => {
      await view.result.current.buy(
        "COURSE",
        "course-1",
        "GST for Freelancers",
      );
    });
    return view;
  };

  it("charges the GST-inclusive total, not the bare item price", async () => {
    await startPurchase();

    // The order stores price and tax separately; opening the widget for the
    // pre-tax figure would undercharge every customer.
    expect(mockedOpenCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        amountInPaise: 294882,
        razorpayOrderId: "order_rzp_1",
      }),
    );
  });

  /**
   * The central rule. The widget's success callback means "a payment was
   * attempted", nothing more.
   */
  it("does not report success when the widget reports success", async () => {
    const view = await startPurchase();

    act(() => widget.onSuccess());

    expect(view.result.current.status).toBe("confirming");
    expect(view.result.current.status).not.toBe("paid");
  });

  it("reports success only once the server says the order is PAID", async () => {
    const onPaid = jest.fn();
    const view = renderHook(() => useCheckout(onPaid));
    await act(async () => {
      await view.result.current.buy("COURSE", "course-1", "Course");
    });

    act(() => widget.onSuccess());
    mockedApi.listMine.mockResolvedValue(orderWithStatus("PAID"));
    await tick(2000);

    await waitFor(() => expect(view.result.current.status).toBe("paid"));
    expect(onPaid).toHaveBeenCalledTimes(1);
  });

  it("reports failure when the server says the payment failed", async () => {
    const view = await startPurchase();

    act(() => widget.onSuccess());
    mockedApi.listMine.mockResolvedValue(orderWithStatus("FAILED"));
    await tick(2000);

    await waitFor(() => expect(view.result.current.status).toBe("failed"));
    expect(view.result.current.error).toMatch(/didn't go through/i);
  });

  /**
   * On timeout the money may well have left the customer's account and the
   * webhook may still be in flight, so the one thing the UI must not do is
   * assert that the payment failed.
   */
  it("does not claim failure when confirmation simply takes too long", async () => {
    const view = await startPurchase();

    act(() => widget.onSuccess());
    await tick(62_000);

    await waitFor(() => expect(view.result.current.status).toBe("idle"));
    expect(view.result.current.status).not.toBe("failed");
    expect(view.result.current.error).toMatch(/still waiting/i);
    expect(view.result.current.error).toMatch(/if you were charged/i);
  });

  it("keeps waiting while the order is still pending", async () => {
    const view = await startPurchase();

    act(() => widget.onSuccess());
    await tick(6000);

    expect(view.result.current.status).toBe("confirming");
  });

  // A dropped request mid-poll is expected; the next tick retries rather than
  // giving up on a payment that may have succeeded.
  it("survives a failed poll and recovers on the next tick", async () => {
    const view = await startPurchase();

    act(() => widget.onSuccess());
    mockedApi.listMine.mockRejectedValueOnce(new Error("network"));
    await tick(2000);
    expect(view.result.current.status).toBe("confirming");

    mockedApi.listMine.mockResolvedValue(orderWithStatus("PAID"));
    await tick(2000);

    await waitFor(() => expect(view.result.current.status).toBe("paid"));
  });

  /**
   * Polling outlives the click that started it. Without teardown it keeps
   * hitting /orders/mine forever after the user navigates away.
   */
  it("stops polling when the component unmounts", async () => {
    const view = await startPurchase();

    act(() => widget.onSuccess());
    await tick(2000);
    const callsBeforeUnmount = mockedApi.listMine.mock.calls.length;

    view.unmount();
    await tick(20_000);

    expect(mockedApi.listMine.mock.calls.length).toBe(callsBeforeUnmount);
  });

  it("returns to idle when the customer closes the modal", async () => {
    const view = await startPurchase();

    act(() => widget.onDismiss());

    expect(view.result.current.status).toBe("idle");
    expect(view.result.current.error).toBeNull();
  });

  it("explains a missing publishable key instead of failing silently", async () => {
    mockedOpenCheckout.mockRejectedValue(
      new Error("RAZORPAY_KEY_ID_NOT_CONFIGURED"),
    );
    const view = await startPurchase();

    expect(view.result.current.status).toBe("failed");
    expect(view.result.current.error).toMatch(/aren't configured/i);
  });

  it("distinguishes an unreachable provider from a misconfigured one", async () => {
    mockedOpenCheckout.mockRejectedValue(new Error("RAZORPAY_SCRIPT_FAILED"));
    const view = await startPurchase();

    expect(view.result.current.error).toMatch(/couldn't reach/i);
  });

  // If the order can't be created there is nothing to pay for, so the widget
  // must not open — an empty modal would look like our bug to the customer.
  it("never opens the widget if the order couldn't be created", async () => {
    mockedApi.createOrder.mockRejectedValue(new Error("API error 500"));
    const view = await startPurchase();

    expect(mockedOpenCheckout).not.toHaveBeenCalled();
    expect(view.result.current.status).toBe("failed");
  });
});
