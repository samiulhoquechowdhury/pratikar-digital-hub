"use client";

import { Role } from "@pratikar/types";
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Loading,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
} from "@pratikar/ui";
import { useCallback, useEffect, useState } from "react";

import { paiseToRupees } from "@/features/templates/lib/fieldSchema";
import { useAuth } from "@/shared/providers/AuthProvider";

import { ordersApi, type AdminOrder } from "../api/ordersApi";

/** Money states, coloured so a refund is never mistaken for a payment. */
const STATUS_TONE = {
  PAID: "success",
  PENDING: "warning",
  FAILED: "danger",
  REFUNDED: "neutral",
} as const;

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

  if (isLoading) return <Loading label="Loading orders…" />;
  if (error)
    return (
      <Alert tone="danger" role="alert">
        {error}
      </Alert>
    );
  if (orders.length === 0) {
    return (
      <EmptyState
        title="No orders yet"
        description="Orders appear here as soon as a customer starts a purchase."
      />
    );
  }

  return (
    <div className="space-y-4">
      {actionError && (
        <Alert tone="danger" role="alert">
          {actionError}
        </Alert>
      )}

      <Table>
        <THead>
          <TR>
            <TH>Placed</TH>
            <TH>Customer</TH>
            <TH>Item</TH>
            <TH align="right">Total</TH>
            <TH>Status</TH>
            <TH align="right">
              <span className="sr-only">Actions</span>
            </TH>
          </TR>
        </THead>
        <TBody>
          {orders.map((order) => (
            <TR key={order.id}>
              <TD muted>
                {new Date(order.createdAt).toLocaleDateString("en-IN")}
              </TD>
              <TD>{order.user.email ?? order.user.phone ?? order.userId}</TD>
              <TD muted>{order.itemType}</TD>
              {/* GST included — this is what actually left the customer. */}
              <TD align="right">
                ₹{paiseToRupees(order.amount + order.gstAmount)}
              </TD>
              <TD>
                <Badge tone={STATUS_TONE[order.status]}>{order.status}</Badge>
              </TD>
              <TD align="right">
                {order.status === "PAID" && canRefund(user?.role) && (
                  // Brand red, reserved for the irreversible action on the
                  // screen. Nothing else here is destructive.
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => void refund(order)}
                    disabled={busyId === order.id}
                  >
                    {busyId === order.id ? "Refunding…" : "Refund"}
                  </Button>
                )}
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
