/**
 * The outside services Pratikar runs on, and the settings each needs. A
 * Super Admin enters these in the admin panel (Integrations); a value saved
 * there wins over the server's environment variable of the same name, so a
 * key can be added or rotated without a redeploy.
 *
 * Storage (Cloudflare R2) and browser push (VAPID) are not here: they're set
 * up once, at boot, with the server, and changing them invalidates files or
 * subscriptions already out there.
 */
export const INTEGRATION_KEYS = [
  "MSG91_API_KEY",
  "MSG91_TEMPLATE_LOGIN_OTP",
  "MSG91_TEMPLATE_DOCUMENT_READY",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_MODEL",
  "VOYAGE_API_KEY",
  "VOYAGE_EMBEDDING_MODEL",
  "GOOGLE_CLIENT_ID",
  "EXPO_ACCESS_TOKEN",
] as const;

export type IntegrationKey = (typeof INTEGRATION_KEYS)[number];

export interface IntegrationField {
  key: IntegrationKey;
  label: string;
  /** Never shown back in full once saved. */
  secret: boolean;
  /** Needed for the service to work at all. */
  required: boolean;
  hint?: string;
  placeholder?: string;
}

export interface IntegrationDefinition {
  id: string;
  name: string;
  /** What breaks without it, in one line. */
  purpose: string;
  /** Where the keys come from. */
  console: string;
  fields: IntegrationField[];
  /** Has a "test connection" check. */
  testable: boolean;
}

export const INTEGRATIONS: IntegrationDefinition[] = [
  {
    id: "msg91",
    name: "MSG91 — SMS",
    purpose:
      "Sign-in codes by text message, and the “document ready” SMS. Without it, nobody can log in by phone in production.",
    console: "https://control.msg91.com",
    testable: true,
    fields: [
      { key: "MSG91_API_KEY", label: "Auth key", secret: true, required: true },
      {
        key: "MSG91_TEMPLATE_LOGIN_OTP",
        label: "Sign-in OTP template ID",
        secret: false,
        required: true,
        hint: "A DLT-approved Flow template with the variables ##otp## and ##minutes##.",
      },
      {
        key: "MSG91_TEMPLATE_DOCUMENT_READY",
        label: "“Document ready” template ID",
        secret: false,
        required: false,
        hint: "A DLT-approved Flow template with the variable ##title##.",
      },
    ],
  },
  {
    id: "resend",
    name: "Resend — email",
    purpose:
      "Order confirmations, review notices and staff sign-in codes. Without it, emails are only logged.",
    console: "https://resend.com/api-keys",
    testable: true,
    fields: [
      { key: "RESEND_API_KEY", label: "API key", secret: true, required: true },
      {
        key: "RESEND_FROM_EMAIL",
        label: "Send from",
        secret: false,
        required: true,
        placeholder: "Pratikar <no-reply@yourdomain.in>",
        hint: "An address on a domain verified in Resend.",
      },
    ],
  },
  {
    id: "razorpay",
    name: "Razorpay — payments",
    purpose:
      "Every purchase on the website and the app. Without it, nothing can be bought.",
    console: "https://dashboard.razorpay.com/app/website-app-settings/api-keys",
    testable: true,
    fields: [
      {
        key: "RAZORPAY_KEY_ID",
        label: "Key ID",
        secret: false,
        required: true,
        placeholder: "rzp_live_…",
        hint: "Public: the checkout uses it. rzp_test_… for test mode.",
      },
      {
        key: "RAZORPAY_KEY_SECRET",
        label: "Key secret",
        secret: true,
        required: true,
      },
      {
        key: "RAZORPAY_WEBHOOK_SECRET",
        label: "Webhook secret",
        secret: true,
        required: true,
        hint: "From Settings → Webhooks, for the URL /payments/webhook.",
      },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic — Pratikar AI",
    purpose: "The assistant, AI drafting and filling templates by chat.",
    console: "https://console.anthropic.com/settings/keys",
    testable: true,
    fields: [
      {
        key: "ANTHROPIC_API_KEY",
        label: "API key",
        secret: true,
        required: true,
      },
      {
        key: "ANTHROPIC_MODEL",
        label: "Model",
        secret: false,
        required: false,
        hint: "Leave blank for the default.",
      },
    ],
  },
  {
    id: "voyage",
    name: "Voyage AI — search",
    purpose: "Meaning-based search behind Pratikar AI's answers.",
    console: "https://dashboard.voyageai.com",
    testable: true,
    fields: [
      { key: "VOYAGE_API_KEY", label: "API key", secret: true, required: true },
      {
        key: "VOYAGE_EMBEDDING_MODEL",
        label: "Embedding model",
        secret: false,
        required: false,
        hint: "Leave blank for the default. Changing it means re-indexing.",
      },
    ],
  },
  {
    id: "google",
    name: "Google sign-in",
    purpose: "“Continue with Google” on the website.",
    console: "https://console.cloud.google.com/apis/credentials",
    testable: false,
    fields: [
      {
        key: "GOOGLE_CLIENT_ID",
        label: "OAuth client ID(s)",
        secret: false,
        required: true,
        placeholder: "…apps.googleusercontent.com",
        hint: "Comma-separate more than one — e.g. the website's and the app's.",
      },
    ],
  },
  {
    id: "expo",
    name: "Expo — app notifications",
    purpose:
      "Push notifications to the Android app. Optional: only needed if push security is on for the Expo account.",
    console: "https://expo.dev/settings/access-tokens",
    testable: false,
    fields: [
      {
        key: "EXPO_ACCESS_TOKEN",
        label: "Access token",
        secret: true,
        required: false,
      },
    ],
  },
];
