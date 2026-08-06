"use client";

import type { CustomerOrder } from "@pratikar/types";
import {
  Alert,
  Badge,
  ButtonLink,
  EmptyState,
  Loading,
  TBody,
  TD,
  TEmpty,
  TH,
  THead,
  TR,
  Table,
} from "@pratikar/ui";
import { formatOrderTotal } from "@pratikar/utils";
import { useEffect, useState } from "react";

import { useAuth } from "@/shared/providers/AuthProvider";

import { paymentsApi } from "../api/paymentsApi";

/** Whatever the order was for — only one of these associations is ever set. */
function describe(order: CustomerOrder): string {
  if (order.contentLibraryItem) return order.contentLibraryItem.title;
  if (order.course) return order.course.title;
  if (order.generatedDocument) return order.generatedDocument.template.title;
  return "—";
}

const ITEM_TYPE_LABELS: Record<CustomerOrder["itemType"], string> = {
  DOCUMENT: "Document",
  DOCUMENT_REVIEW: "Lawyer review",
  CONTENT_ITEM: "Content library",
  COURSE: "Course",
};

/**
 * Status is a badge rather than raw text, and never colour alone — the label
 * carries the meaning on its own, so it still reads correctly in greyscale or
 * to anyone who can't distinguish the tones.
 */
const STATUS: Record<
  CustomerOrder["status"],
  { label: string; tone: "success" | "warning" | "danger" | "neutral" }
> = {
  PAID: { label: "Paid", tone: "success" },
  PENDING: { label: "Pending", tone: "warning" },
  FAILED: { label: "Failed", tone: "danger" },
  REFUNDED: { label: "Refunded", tone: "neutral" },
};

export function MyPurchases() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(!!user);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    paymentsApi
      .listMine()
      .then((result) => {
        if (!cancelled) setOrders(result);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load your purchases.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) {
    return (
      <EmptyState
        title="Sign in to see your purchases"
        action={<ButtonLink href="/login?next=/dashboard">Sign in</ButtonLink>}
      />
    );
  }
  if (isLoading) return <Loading label="Loading your purchases…" />;
  if (error) {
    return (
      <Alert tone="danger" role="alert">
        {error}
      </Alert>
    );
  }

  return (
    <Table>
      <THead>
        <TR>
          <TH>Item</TH>
          <TH>Type</TH>
          <TH align="right">Total</TH>
          <TH>Status</TH>
          <TH align="right">Date</TH>
        </TR>
      </THead>
      <TBody>
        {orders.length === 0 ? (
          <TEmpty colSpan={5}>You haven&apos;t bought anything yet.</TEmpty>
        ) : (
          orders.map((order) => (
            <TR key={order.id}>
              <TD>{describe(order)}</TD>
              <TD muted>{ITEM_TYPE_LABELS[order.itemType]}</TD>
              {/* GST included — see formatOrderTotal. */}
              <TD align="right">{formatOrderTotal(order)}</TD>
              <TD>
                <Badge tone={STATUS[order.status].tone}>
                  {STATUS[order.status].label}
                </Badge>
              </TD>
              <TD align="right" muted>
                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </TD>
            </TR>
          ))
        )}
      </TBody>
    </Table>
  );
}
