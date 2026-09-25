"use client";

import type { CustomerOrder } from "@pratikar/types";
import {
  Badge,
  ButtonLink,
  EmptyState,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
} from "@pratikar/ui";
import { formatOrderTotal } from "@pratikar/utils";

import { InvoiceButton } from "./InvoiceButton";

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

/** Presentational — the account is loaded once by useDashboardData. */
export function MyPurchases({ orders }: { orders: CustomerOrder[] }) {
  if (orders.length === 0) {
    return (
      <EmptyState
        title="Nothing bought yet"
        description="Documents, courses and library downloads all appear here with their invoices."
        action={<ButtonLink href="/documents">Browse templates</ButtonLink>}
      />
    );
  }

  return (
    <Table label="Your purchases">
      <THead>
        <TR>
          <TH>Item</TH>
          <TH secondary>Type</TH>
          <TH align="right">Total</TH>
          <TH>Status</TH>
          <TH align="right" secondary>
            Date
          </TH>
          <TH align="right">Invoice</TH>
        </TR>
      </THead>
      <TBody>
        {orders.map((order) => (
          <TR key={order.id}>
            <TD>{describe(order)}</TD>
            <TD muted secondary>
              {ITEM_TYPE_LABELS[order.itemType]}
            </TD>
            {/* GST included — see formatOrderTotal. */}
            <TD align="right">{formatOrderTotal(order)}</TD>
            <TD>
              <Badge tone={STATUS[order.status].tone}>
                {STATUS[order.status].label}
              </Badge>
            </TD>
            <TD align="right" muted secondary>
              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </TD>
            {/*
              Only paid and refunded orders have one. A refunded order keeps
              its invoice — the sale happened, and cancelling it is a credit
              note rather than the invoice disappearing.
            */}
            <TD align="right">
              {order.status === "PAID" || order.status === "REFUNDED" ? (
                <InvoiceButton orderId={order.id} />
              ) : (
                <span className="text-xs text-ink-subtle">—</span>
              )}
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
