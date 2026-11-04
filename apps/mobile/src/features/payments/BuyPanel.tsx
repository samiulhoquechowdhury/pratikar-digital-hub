import type { CouponQuote, OrderItemType } from "@pratikar/types";
import { grossPaise, GST_RATE } from "@pratikar/utils";
import { router } from "expo-router";
import { Tag, X } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Text, TextInput } from "@/components/Typography";
import { Button, Notice } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { colors, radius, space, text } from "@/lib/theme";
import { useAuth } from "@/providers/AuthProvider";

import { couponMessage } from "./couponMessages";
import { paymentsApi } from "./paymentsApi";
import { useCheckout } from "./useCheckout";

/**
 * The website's BuyButton: the price with GST (what will be charged), an
 * optional discount code, and a Buy button that reports honestly on where
 * the payment got to. Signed out, it asks to log in first.
 */
export function BuyPanel({
  itemType,
  itemId,
  label,
  priceInPaise,
  onPaid,
  buyLabel = "Buy now",
}: {
  itemType: OrderItemType;
  itemId: string;
  label: string;
  /** Before GST. */
  priceInPaise: number;
  onPaid?: () => void;
  buyLabel?: string;
}) {
  const { user, isRestoring } = useAuth();
  const { buy, status, error } = useCheckout(onPaid);
  const [quote, setQuote] = useState<CouponQuote | null>(null);
  const gross = grossPaise(priceInPaise);
  const gst = `${Math.round(GST_RATE * 100)}% GST`;

  const price = quote ? (
    <View style={{ gap: 2 }}>
      <View style={styles.priceRow}>
        <Text style={styles.price}>{formatPrice(quote.totalInPaise)}</Text>
        <Text style={styles.was}>{formatPrice(gross)}</Text>
      </View>
      <Text style={text.small}>
        {formatPrice(quote.amountInPaise)} + {gst} · you save{" "}
        {formatPrice(gross - quote.totalInPaise)}
      </Text>
    </View>
  ) : (
    <View style={styles.priceRow}>
      <Text style={styles.price}>{formatPrice(gross)}</Text>
      <Text style={text.small}>
        {formatPrice(priceInPaise)} + {gst}
      </Text>
    </View>
  );

  if (!user) {
    return (
      <View style={styles.panel}>
        {price}
        <Button
          label="Log in to buy"
          disabled={isRestoring}
          onPress={() => router.push("/login")}
        />
        <Text style={text.small}>
          New here? Logging in creates your account — it takes one code texted
          to your phone.
        </Text>
      </View>
    );
  }

  if (status === "paid") {
    return (
      <Notice tone="success">
        Payment confirmed. Your purchase is ready below.
      </Notice>
    );
  }

  const busy = status === "creating" || status === "open";
  return (
    <View style={styles.panel}>
      {price}
      <CouponField
        itemType={itemType}
        itemId={itemId}
        quote={quote}
        onQuote={setQuote}
        disabled={busy || status === "confirming"}
      />
      <Button
        label={buyLabel}
        loading={busy}
        disabled={status === "confirming"}
        onPress={() => void buy(itemType, itemId, label, quote?.code)}
      />
      {status === "confirming" ? (
        <Notice>
          Confirming your payment with the provider. This usually takes a few
          seconds — please keep this screen open.
        </Notice>
      ) : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}
    </View>
  );
}

/** Folded away until asked for; the server checks the code again at purchase. */
function CouponField({
  itemType,
  itemId,
  quote,
  onQuote,
  disabled,
}: {
  itemType: OrderItemType;
  itemId: string;
  quote: CouponQuote | null;
  onQuote: (quote: CouponQuote | null) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  if (quote) {
    return (
      <View style={styles.applied}>
        <Tag color={colors.success} size={16} />
        <Text style={[styles.appliedText, { flex: 1 }]}>
          <Text style={{ fontWeight: "700" }}>{quote.code}</Text> applied
          {quote.description ? ` — ${quote.description}` : ""}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove code ${quote.code}`}
          disabled={disabled}
          hitSlop={8}
          onPress={() => {
            onQuote(null);
            setCode("");
          }}
          style={styles.remove}
        >
          <X color={colors.ink} size={16} />
          <Text style={{ fontWeight: "700", color: colors.ink }}>Remove</Text>
        </Pressable>
      </View>
    );
  }

  if (!open) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={styles.toggle}
        hitSlop={8}
      >
        <Tag color={colors.ink} size={16} />
        <Text style={{ fontWeight: "700", color: colors.ink }}>
          Have a coupon code?
        </Text>
      </Pressable>
    );
  }

  const apply = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setChecking(true);
    setProblem(null);
    try {
      onQuote(await paymentsApi.quote(trimmed, itemType, itemId));
    } catch (e) {
      setProblem(couponMessage(e));
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={{ gap: space.sm }}>
      <Text style={{ fontWeight: "600", color: colors.ink }}>Coupon code</Text>
      <View style={{ flexDirection: "row", gap: space.sm }}>
        <TextInput
          accessibilityLabel="Coupon code"
          value={code}
          onChangeText={(value) => setCode(value.toUpperCase())}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={32}
          onSubmitEditing={() => void apply()}
          style={[
            styles.input,
            problem ? { borderColor: colors.danger } : null,
          ]}
        />
        <Button
          label="Apply"
          variant="secondary"
          loading={checking}
          disabled={disabled || !code.trim()}
          onPress={() => void apply()}
          style={{ paddingHorizontal: space.lg }}
        />
      </View>
      {problem ? (
        <Text
          accessibilityRole="alert"
          style={{ color: colors.danger, fontSize: 13 }}
        >
          {problem}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: space.lg },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: space.md,
  },
  price: { fontSize: 28, fontWeight: "800", color: colors.ink },
  was: {
    fontSize: 16,
    color: colors.inkSubtle,
    textDecorationLine: "line-through",
  },
  applied: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.control,
    backgroundColor: colors.successSubtle,
  },
  appliedText: { color: colors.success, fontSize: 14 },
  remove: { flexDirection: "row", alignItems: "center", gap: 4 },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    alignSelf: "flex-start",
  },
  input: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.control,
    paddingHorizontal: space.md,
    fontSize: 16,
    letterSpacing: 1,
    color: colors.ink,
  },
});
