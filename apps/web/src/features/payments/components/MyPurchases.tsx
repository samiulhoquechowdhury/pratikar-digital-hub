"use client";

import type { CustomerOrder } from "@pratikar/types";
import { formatOrderTotal } from "@pratikar/utils";
import Link from "next/link";
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
      <p>
        <Link href="/login">Sign in</Link> to see your purchases.
      </p>
    );
  }
  if (isLoading) return <p>Loading your purchases…</p>;
  if (error) return <p role="alert">{error}</p>;
  if (orders.length === 0) return <p>You haven&apos;t bought anything yet.</p>;

  return (
    <table>
      <thead>
        <tr>
          <th scope="col">Item</th>
          <th scope="col">Type</th>
          <th scope="col">Total</th>
          <th scope="col">Status</th>
          <th scope="col">Date</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr key={order.id}>
            <td>{describe(order)}</td>
            <td>{ITEM_TYPE_LABELS[order.itemType]}</td>
            {/* GST included — see formatOrderTotal. */}
            <td>{formatOrderTotal(order)}</td>
            <td>{order.status}</td>
            <td>{new Date(order.createdAt).toLocaleDateString("en-IN")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
