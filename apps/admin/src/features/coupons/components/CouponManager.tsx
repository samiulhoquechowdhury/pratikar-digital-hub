"use client";

import type { AdminCoupon, OrderItemType } from "@pratikar/types";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  SkeletonList,
} from "@pratikar/ui";
import { useCallback, useEffect, useState } from "react";

import { couponsApi } from "../api/couponsApi";
import {
  BLANK_FORM,
  ITEM_TYPE_LABELS,
  offerOf,
  stateOf,
  toForm,
  toInput,
  type CouponForm,
} from "../lib/couponForm";

const STATE_TONES = {
  Live: "success",
  Scheduled: "brand",
  Expired: "neutral",
  "Used up": "neutral",
  Off: "warning",
} as const;

const rupees = (paise: number) =>
  `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const dayOf = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

/**
 * Discount codes: create one, change its terms, switch it off. Each row
 * says what the code gives, whether it's live right now, and how much it
 * has actually been used — paid orders only.
 */
export function CouponManager() {
  const [coupons, setCoupons] = useState<AdminCoupon[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{
    id: string | null;
    form: CouponForm;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setCoupons(await couponsApi.list());
    } catch {
      setError("Couldn't load the coupons.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!editing) return;
    const input = toInput(editing.form);
    if (typeof input === "string") {
      setError(input);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editing.id) await couponsApi.update(editing.id, input);
      else await couponsApi.create(input);
      setEditing(null);
      await load();
    } catch (cause) {
      setError(
        String(cause).includes("COUPON_CODE_TAKEN")
          ? "Another coupon already uses that code."
          : "Couldn't save the coupon. Check the values and try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (coupon: AdminCoupon) => {
    const input = toInput({ ...toForm(coupon), active: !coupon.active });
    if (typeof input === "string") {
      setError(input);
      return;
    }
    setError(null);
    try {
      await couponsApi.update(coupon.id, input);
      await load();
    } catch {
      setError("Couldn't change that coupon.");
    }
  };

  if (!coupons && !error)
    return <SkeletonList rows={4} label="Loading coupons…" />;

  const set = <K extends keyof CouponForm>(key: K, value: CouponForm[K]) =>
    setEditing((current) =>
      current
        ? { ...current, form: { ...current.form, [key]: value } }
        : current,
    );

  const toggleKind = (type: OrderItemType, on: boolean) =>
    setEditing((current) => {
      if (!current) return current;
      const appliesTo = on
        ? [...current.form.appliesTo, type]
        : current.form.appliesTo.filter((t) => t !== type);
      return { ...current, form: { ...current.form, appliesTo } };
    });

  return (
    <div className="space-y-6">
      {error && (
        <Alert tone="danger" role="alert">
          {error}
        </Alert>
      )}

      {editing ? (
        <Card className="p-6">
          <h2 className="text-lg font-semibold">
            {editing.id ? "Edit coupon" : "New coupon"}
          </h2>
          <form
            className="mt-4 max-w-3xl space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Code"
                htmlFor="coupon-code"
                hint="What customers type. Letters, digits, - or _."
              >
                <Input
                  id="coupon-code"
                  value={editing.form.code}
                  maxLength={32}
                  className="font-mono uppercase"
                  onChange={(e) => set("code", e.target.value.toUpperCase())}
                />
              </Field>
              <Field
                label="Description"
                htmlFor="coupon-description"
                hint="Shown to the customer when it applies."
              >
                <Input
                  id="coupon-description"
                  value={editing.form.description}
                  maxLength={120}
                  placeholder="Launch offer"
                  onChange={(e) => set("description", e.target.value)}
                />
              </Field>
            </div>

            <fieldset>
              <legend className="text-sm font-semibold text-ink">
                Discount
              </legend>
              <div className="mt-2 flex flex-wrap gap-4 text-sm">
                {(["PERCENT", "FLAT"] as const).map((kind) => (
                  <label key={kind} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="coupon-kind"
                      checked={editing.form.kind === kind}
                      onChange={() => set("kind", kind)}
                    />
                    {kind === "PERCENT" ? "Percentage off" : "Fixed amount off"}
                  </label>
                ))}
              </div>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Field
                  label={
                    editing.form.kind === "PERCENT"
                      ? "Percent off"
                      : "Rupees off"
                  }
                  htmlFor="coupon-value"
                  hint={
                    editing.form.kind === "PERCENT"
                      ? "1 to 100. Taken off the price before GST."
                      : "Taken off the price before GST."
                  }
                >
                  <Input
                    id="coupon-value"
                    inputMode="decimal"
                    value={editing.form.value}
                    onChange={(e) => set("value", e.target.value)}
                  />
                </Field>
                {editing.form.kind === "PERCENT" && (
                  <Field
                    label="Maximum discount (₹)"
                    htmlFor="coupon-max"
                    hint="Optional. Blank for no cap."
                  >
                    <Input
                      id="coupon-max"
                      inputMode="decimal"
                      value={editing.form.maxDiscount}
                      onChange={(e) => set("maxDiscount", e.target.value)}
                    />
                  </Field>
                )}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-semibold text-ink">
                Applies to
              </legend>
              <p className="text-sm text-ink-muted">
                Leave all unticked for every kind of purchase.
              </p>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {(Object.keys(ITEM_TYPE_LABELS) as OrderItemType[]).map(
                  (type) => (
                    <label key={type} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editing.form.appliesTo.includes(type)}
                        onChange={(e) => toggleKind(type, e.target.checked)}
                      />
                      {ITEM_TYPE_LABELS[type]}
                    </label>
                  ),
                )}
              </div>
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                label="Minimum order (₹)"
                htmlFor="coupon-min"
                hint="Before GST. Optional."
              >
                <Input
                  id="coupon-min"
                  inputMode="decimal"
                  value={editing.form.minOrder}
                  onChange={(e) => set("minOrder", e.target.value)}
                />
              </Field>
              <Field
                label="Total uses"
                htmlFor="coupon-total"
                hint="Across everyone. Blank for no limit."
              >
                <Input
                  id="coupon-total"
                  inputMode="numeric"
                  value={editing.form.maxRedemptions}
                  onChange={(e) => set("maxRedemptions", e.target.value)}
                />
              </Field>
              <Field
                label="Uses per customer"
                htmlFor="coupon-per-user"
                hint="Usually 1."
              >
                <Input
                  id="coupon-per-user"
                  inputMode="numeric"
                  value={editing.form.perUserLimit}
                  onChange={(e) => set("perUserLimit", e.target.value)}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Starts"
                htmlFor="coupon-start"
                hint="Optional. From the start of this day, India time."
              >
                <Input
                  id="coupon-start"
                  type="date"
                  value={editing.form.startsOn}
                  onChange={(e) => set("startsOn", e.target.value)}
                />
              </Field>
              <Field
                label="Ends"
                htmlFor="coupon-end"
                hint="Optional. Until the end of this day, India time."
              >
                <Input
                  id="coupon-end"
                  type="date"
                  value={editing.form.endsOn}
                  onChange={(e) => set("endsOn", e.target.value)}
                />
              </Field>
            </div>

            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={editing.form.active}
                onChange={(e) => set("active", e.target.checked)}
              />
              Active — customers can use it within its dates
            </label>

            <p className="text-sm text-ink-muted">
              A discount never takes an order below ₹1, and GST is charged on
              the discounted price.
            </p>

            <div className="flex gap-3">
              <Button type="submit" loading={saving} loadingLabel="Saving…">
                Save coupon
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditing(null);
                  setError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Button onClick={() => setEditing({ id: null, form: BLANK_FORM })}>
          New coupon
        </Button>
      )}

      {coupons && coupons.length === 0 ? (
        <EmptyState
          title="No coupons yet"
          description="Create a code for a launch offer, a partner, or a returning customer."
        />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
          {(coupons ?? []).map((coupon) => {
            const state = stateOf(coupon);
            return (
              <li
                key={coupon.id}
                className="flex flex-wrap items-start gap-x-6 gap-y-2 px-4 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-base font-semibold text-ink">
                      {coupon.code}
                    </span>
                    <Badge tone={STATE_TONES[state]}>{state}</Badge>
                  </p>
                  <p className="mt-1 text-sm text-ink">
                    {offerOf(coupon)}
                    {coupon.description ? ` · ${coupon.description}` : ""}
                  </p>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    {coupon.appliesTo.length === 0
                      ? "Everything"
                      : coupon.appliesTo
                          .map((type) => ITEM_TYPE_LABELS[type])
                          .join(", ")}
                    {coupon.minOrderInPaise != null &&
                      ` · min ${rupees(coupon.minOrderInPaise)}`}
                    {coupon.startsAt && ` · from ${dayOf(coupon.startsAt)}`}
                    {coupon.endsAt && ` · until ${dayOf(coupon.endsAt)}`}
                  </p>
                </div>
                <div className="text-sm">
                  <p className="font-semibold tabular-nums text-ink">
                    {coupon.redemptions}
                    {coupon.maxRedemptions != null &&
                      ` / ${coupon.maxRedemptions}`}{" "}
                    used
                  </p>
                  <p className="tabular-nums text-ink-muted">
                    {rupees(coupon.discountGivenInPaise)} given
                  </p>
                </div>
                <div className="flex gap-3 text-sm font-semibold">
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => {
                      setError(null);
                      setEditing({ id: coupon.id, form: toForm(coupon) });
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => void toggleActive(coupon)}
                  >
                    {coupon.active ? "Switch off" : "Switch on"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
