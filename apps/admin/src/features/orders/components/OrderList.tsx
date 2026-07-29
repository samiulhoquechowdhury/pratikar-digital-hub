"use client";

import { Role } from "@pratikar/types";
import { useCallback, useEffect, useState } from "react";

import { paiseToRupees } from "@/features/templates/lib/fieldSchema";
import { useAuth } from "@/shared/providers/AuthProvider";

import { ordersApi, type AdminOrder } from "../api/ordersApi";

/** Only ADMIN and SUPER_ADMIN can refund — SUPPORT can look but not touch. */
const canRefund = (role: Role | undefined) =>
  role === Role.ADMIN || role === Role.SUPER_ADMIN;

export function OrderList() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setOrders(await ordersApi.list());
      setError(null);
    } catch {
      setError("Couldn't load orders.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refund = async (order: AdminOrder) => {
    // Refunds move real money and there's no undo, so make the operator
    // confirm against the specific amount and account rather than a generic
    // "are you sure".
    const total = paiseToRupees(order.amount + order.gstAmount);
    const who = order.user.email ?? order.user.phone ?? order.userId;
    if (!window.confirm(`Refund ₹${total} to ${who}? This cannot be undone.`)) {
      return;
    }

    setBusyId(order.id);
    setActionError(null);
    try {
      await ordersApi.refund(order.id);
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setActionError(
        message.includes("ORDER_NOT_REFUNDABLE")
          ? "Only a PAID order can be refunded."
          : message.includes("NO_PAYMENT_TO_REFUND")
            ? "That order has no captured payment to refund."
            : "Couldn't refund that order.",
      );
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) return <p>Loading orders…</p>;
  if (error) return <p role="alert">{error}</p>;
  if (orders.length === 0) return <p>No orders yet.</p>;

  return (
    <div>
      {actionError && <p role="alert">{actionError}</p>}
      <table>
        <thead>
          <tr>
            <th scope="col">Placed</th>
            <th scope="col">Customer</th>
            <th scope="col">Item</th>
            <th scope="col">Total</th>
            <th scope="col">Status</th>
            <th scope="col" />
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{new Date(order.createdAt).toLocaleDateString()}</td>
              <td>{order.user.email ?? order.user.phone ?? order.userId}</td>
              <td>{order.itemType}</td>
              <td>₹{paiseToRupees(order.amount + order.gstAmount)}</td>
              <td>{order.status}</td>
              <td>
                {order.status === "PAID" && canRefund(user?.role) && (
                  <button
                    type="button"
                    onClick={() => void refund(order)}
                    disabled={busyId === order.id}
                  >
                    {busyId === order.id ? "Refunding…" : "Refund"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
