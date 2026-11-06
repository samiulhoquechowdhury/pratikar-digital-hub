import type { CustomerOrder, OrderStatus } from "@pratikar/types";
import { Stack } from "expo-router";
import { FileDown } from "lucide-react-native";
import { useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";

import { Text } from "@/components/Typography";
import { Button, Notice, Pill, StateView } from "@/components/ui";
import { paymentsApi } from "@/features/payments/paymentsApi";
import { useOrders } from "@/features/payments/useOrders";
import { saveAndShare } from "@/lib/download";
import { formatDate, formatPrice } from "@/lib/format";
import { colors, radius, space, text, shadow } from "@/lib/theme";

const STATUS: Record<
  OrderStatus,
  { label: string; tone: "success" | "warning" | "danger" | "neutral" }
> = {
  PAID: { label: "Paid", tone: "success" },
  PENDING: { label: "Pending", tone: "warning" },
  FAILED: { label: "Failed", tone: "danger" },
  REFUNDED: { label: "Refunded", tone: "neutral" },
};

/** What an order was for, in words. */
function orderTitle(order: CustomerOrder): string {
  const doc = order.generatedDocument;
  const docTitle = doc?.title ?? doc?.template?.title;
  switch (order.itemType) {
    case "DOCUMENT_REVIEW":
      return `Advocate review${docTitle ? `: ${docTitle}` : ""}`;
    case "DOCUMENT":
      return docTitle ?? "Document";
    case "CONTENT_ITEM":
      return order.contentLibraryItem?.title ?? "Library item";
    case "COURSE":
      return order.course?.title ?? "Course";
  }
}

/** Every order, with its GST invoice once paid. */
export default function OrdersScreen() {
  const orders = useOrders();

  return (
    <>
      <Stack.Screen options={{ title: "Orders and invoices" }} />
      {orders.isPending ? (
        <StateView loading />
      ) : orders.isError ? (
        <StateView
          title="Couldn't load your orders"
          action={
            <Button label="Try again" onPress={() => void orders.refetch()} />
          }
        />
      ) : (
        <FlatList
          data={orders.data}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{
            padding: space.lg,
            gap: space.md,
            flexGrow: 1,
          }}
          onRefresh={() => void orders.refetch()}
          refreshing={orders.isRefetching}
          ListEmptyComponent={
            <StateView
              title="No orders yet"
              body="What you buy appears here, with its invoice."
            />
          }
          renderItem={({ item }) => <OrderRow order={item} />}
        />
      )}
    </>
  );
}

function OrderRow({ order }: { order: CustomerOrder }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proforma, setProforma] = useState(false);
  const status = STATUS[order.status];

  const invoice = async () => {
    setBusy(true);
    setError(null);
    try {
      // Minted on tap: the link inside is signed and short-lived.
      const inv = await paymentsApi.getInvoice(order.id);
      setProforma(inv.isProforma);
      await saveAndShare(
        inv.downloadUrl,
        `${inv.invoiceNumber.replaceAll("/", "-")}.pdf`,
      );
    } catch {
      setError("Couldn't get the invoice. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.row}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: space.md,
        }}
      >
        <Text style={[text.subheading, { flex: 1 }]}>{orderTitle(order)}</Text>
        <Text style={styles.amount}>
          {formatPrice(order.amount + order.gstAmount)}
        </Text>
      </View>
      <View
        style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}
      >
        <Pill label={status.label} tone={status.tone} />
        <Text style={text.small}>{formatDate(order.createdAt)}</Text>
      </View>
      {order.status === "PAID" || order.status === "REFUNDED" ? (
        <Button
          label="Invoice"
          variant="secondary"
          icon={<FileDown color={colors.primary} size={18} />}
          loading={busy}
          onPress={() => void invoice()}
          style={{ alignSelf: "flex-start", minHeight: 40 }}
        />
      ) : null}
      {proforma ? (
        <Notice tone="warning">
          This is a proforma invoice — GST registration isn't set up yet, so it
          isn't a valid tax invoice.
        </Notice>
      ) : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: space.sm,
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    ...shadow,
  },
  amount: { fontSize: 16, fontWeight: "800", color: colors.ink },
});
