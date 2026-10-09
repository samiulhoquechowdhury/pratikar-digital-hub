/**
 * Is this deployment configured to take real customers?
 *
 * One plain function over the environment, so every rule is testable and
 * the admin's launch checklist and the production start-up guard read the
 * same rules. Never returns a secret's value — only whether it's right.
 */

export type CheckStatus = "ok" | "warn" | "fail";

export interface ReadinessCheck {
  id: string;
  area: string;
  label: string;
  status: CheckStatus;
  /** What's true now, in plain words. */
  detail: string;
  /** What to do about it, when it isn't ok. */
  fix?: string;
}

type Env = Record<string, string | undefined>;

/** The placeholder the code falls back to. Published in the repository. */
export const DEV_SECRET = "dev-only-secret-change-me";

/** Shortest secret accepted: 32 characters is 192+ bits of a random string. */
const MIN_SECRET_LENGTH = 32;

const set = (value: string | undefined) => Boolean(value && value.trim());

const isLocal = (url: string) =>
  /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|\/|$)/i.test(url);

/**
 * A secret that signs logins, sign-in codes or download links. Missing or
 * left at the published default, anyone could forge what it signs.
 */
function secret(
  env: Env,
  name: string,
  label: string,
  protects: string,
): ReadinessCheck {
  const value = env[name] ?? "";
  const base = { id: name, area: "Security", label };
  if (!value || value === DEV_SECRET) {
    return {
      ...base,
      status: "fail",
      detail: value
        ? `${name} is the published development value — anyone could forge ${protects}.`
        : `${name} is not set${name === "STORAGE_URL_SECRET" ? "" : " — the code falls back to a published development value"}.`,
      fix: `Set ${name} to a long random string: openssl rand -hex 32`,
    };
  }
  if (value.length < MIN_SECRET_LENGTH) {
    return {
      ...base,
      status: "fail",
      detail: `${name} is only ${value.length} characters.`,
      fix: `Use at least ${MIN_SECRET_LENGTH} random characters: openssl rand -hex 32`,
    };
  }
  return { ...base, status: "ok", detail: `Set (${value.length} characters).` };
}

/** A public URL a customer's browser or email will follow. */
function publicUrl(
  env: Env,
  name: string,
  label: string,
  usedFor: string,
): ReadinessCheck {
  const value = env[name]?.trim() ?? "";
  const base = { id: name, area: "Addresses", label };
  if (!value) {
    return {
      ...base,
      status: "fail",
      detail: `${name} is not set, so ${usedFor} point at localhost.`,
      fix: `Set ${name} to the live address, e.g. https://…`,
    };
  }
  if (isLocal(value) || !value.startsWith("https://")) {
    return {
      ...base,
      status: "fail",
      detail: `${name} is ${value} — ${usedFor} need the live https address.`,
      fix: `Set ${name} to the live https:// address.`,
    };
  }
  return { ...base, status: "ok", detail: value };
}

/** The security secrets alone — what the production start-up guard enforces. */
export function securityChecks(env: Env): ReadinessCheck[] {
  return [
    secret(
      env,
      "JWT_ACCESS_SECRET",
      "Login token secret",
      "anyone's login, staff included",
    ),
    secret(env, "OTP_HMAC_SECRET", "Sign-in code secret", "sign-in codes"),
    secret(
      env,
      "STORAGE_URL_SECRET",
      "Download link secret",
      "download links to paid files",
    ),
  ];
}

export function configChecks(env: Env): ReadinessCheck[] {
  const checks: ReadinessCheck[] = [...securityChecks(env)];

  checks.push(
    env.NODE_ENV === "production"
      ? {
          id: "NODE_ENV",
          area: "Security",
          label: "Production mode",
          status: "ok",
          detail: "NODE_ENV=production.",
        }
      : {
          id: "NODE_ENV",
          area: "Security",
          label: "Production mode",
          status: "fail",
          detail: `NODE_ENV is ${env.NODE_ENV ?? "not set"}: failed emails are logged instead of reported, sign-in codes included.`,
          fix: "Set NODE_ENV=production (the Docker image already does).",
        },
  );

  // Addresses
  checks.push(
    publicUrl(
      env,
      "PUBLIC_SITE_URL",
      "Website address",
      "links in emails and notifications",
    ),
    publicUrl(
      env,
      "ADMIN_SITE_URL",
      "Admin panel address",
      "links in staff alerts",
    ),
    publicUrl(env, "PUBLIC_API_URL", "API address", "download links"),
  );
  const origins = (env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  checks.push(
    origins.length === 0
      ? {
          id: "ALLOWED_ORIGINS",
          area: "Addresses",
          label: "Allowed websites (CORS)",
          status: "fail",
          detail:
            "ALLOWED_ORIGINS is not set, so only http://localhost:3000 may call the API.",
          fix: "Set ALLOWED_ORIGINS to the website and admin addresses, comma-separated.",
        }
      : origins.some((o) => isLocal(o) || !o.startsWith("https://"))
        ? {
            id: "ALLOWED_ORIGINS",
            area: "Addresses",
            label: "Allowed websites (CORS)",
            status: "warn",
            detail: `Includes a non-https or local address: ${origins.filter((o) => isLocal(o) || !o.startsWith("https://")).join(", ")}.`,
            fix: "List only the live https:// website and admin addresses.",
          }
        : {
            id: "ALLOWED_ORIGINS",
            area: "Addresses",
            label: "Allowed websites (CORS)",
            status: "ok",
            detail: origins.join(", "),
          },
  );
  checks.push(
    Number(env.TRUST_PROXY_HOPS ?? 0) > 0
      ? {
          id: "TRUST_PROXY_HOPS",
          area: "Addresses",
          label: "Proxy hops",
          status: "ok",
          detail: `${env.TRUST_PROXY_HOPS}.`,
        }
      : {
          id: "TRUST_PROXY_HOPS",
          area: "Addresses",
          label: "Proxy hops",
          status: "warn",
          detail:
            "Not set: behind Railway's proxy every visitor looks like the same IP, so per-person rate limits (sign-in codes, chat) apply to everyone at once.",
          fix: "Set TRUST_PROXY_HOPS to the number of proxies in front of the API (usually 1 on Railway).",
        },
  );

  // Files
  const r2 = ["R2_ACCOUNT_ID", "R2_BUCKET"].filter((n) => !set(env[n]));
  if (!set(env.R2_ACCESS_KEY_ID) && !set(env.R2_ACCESS_KEY))
    r2.push("R2_ACCESS_KEY_ID");
  if (!set(env.R2_SECRET_ACCESS_KEY) && !set(env.R2_SECRET_KEY))
    r2.push("R2_SECRET_ACCESS_KEY");
  checks.push(
    r2.length === 0
      ? {
          id: "R2",
          area: "Files",
          label: "Cloudflare R2 storage",
          status: "ok",
          detail: `Bucket ${env.R2_BUCKET}.`,
        }
      : {
          id: "R2",
          area: "Files",
          label: "Cloudflare R2 storage",
          status: "fail",
          detail: `Missing ${r2.join(", ")} — files would be kept on the server's disk and lost on the next deploy.`,
          fix: "Set the four R2 values from Cloudflare's R2 dashboard.",
        },
  );

  // Payments
  const razorpayMissing = [
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "RAZORPAY_WEBHOOK_SECRET",
  ].filter((n) => !set(env[n]));
  checks.push(
    razorpayMissing.length > 0
      ? {
          id: "RAZORPAY",
          area: "Payments",
          label: "Razorpay",
          status: "fail",
          detail: `Missing ${razorpayMissing.join(", ")} — nobody can pay.`,
          fix: "Set the key id, key secret and webhook secret from Razorpay's dashboard, and add the webhook URL there: <API address>/orders/webhook.",
        }
      : env.RAZORPAY_KEY_ID!.startsWith("rzp_test_")
        ? {
            id: "RAZORPAY",
            area: "Payments",
            label: "Razorpay",
            status: "warn",
            detail: "Test keys — payments go through but no money moves.",
            fix: "Switch to the live keys (rzp_live_…) and the live webhook secret before launch.",
          }
        : {
            id: "RAZORPAY",
            area: "Payments",
            label: "Razorpay",
            status: "ok",
            detail: "Live keys and webhook secret set.",
          },
  );
  const invoice = [
    "COMPANY_LEGAL_NAME",
    "COMPANY_GSTIN",
    "COMPANY_ADDRESS",
    "COMPANY_STATE_CODE",
  ].filter((n) => !set(env[n]));
  const gstin = env.COMPANY_GSTIN?.trim().toUpperCase() ?? "";
  checks.push(
    invoice.length > 0
      ? {
          id: "INVOICE",
          area: "Payments",
          label: "GST invoice details",
          status: "fail",
          detail: `Missing ${invoice.join(", ")} — invoices can't be issued as GST-compliant.`,
          fix: "Set the company's legal name, GSTIN, registered address and two-digit state code.",
        }
      : !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]{3}$/.test(gstin)
        ? {
            id: "INVOICE",
            area: "Payments",
            label: "GST invoice details",
            status: "fail",
            detail: "COMPANY_GSTIN is not a valid 15-character GSTIN.",
            fix: "Check COMPANY_GSTIN against the GST certificate.",
          }
        : gstin.slice(0, 2) !== env.COMPANY_STATE_CODE?.trim()
          ? {
              id: "INVOICE",
              area: "Payments",
              label: "GST invoice details",
              status: "fail",
              detail:
                "COMPANY_GSTIN's state code doesn't match COMPANY_STATE_CODE — every invoice would carry the wrong tax split.",
              fix: "Correct whichever is wrong.",
            }
          : {
              id: "INVOICE",
              area: "Payments",
              label: "GST invoice details",
              status: "ok",
              detail: `${env.COMPANY_LEGAL_NAME} · ${gstin}`,
            },
  );

  // Messages
  checks.push(
    !set(env.RESEND_API_KEY)
      ? {
          id: "RESEND",
          area: "Messages",
          label: "Email (Resend)",
          status: "fail",
          detail:
            "RESEND_API_KEY is not set — no sign-in codes or receipts can be emailed.",
          fix: "Set RESEND_API_KEY and RESEND_FROM_EMAIL on a verified domain.",
        }
      : !set(env.RESEND_FROM_EMAIL) ||
          env.RESEND_FROM_EMAIL!.endsWith("@resend.dev")
        ? {
            id: "RESEND",
            area: "Messages",
            label: "Email (Resend)",
            status: "fail",
            detail:
              "Sending from Resend's test domain — mail only reaches the Resend account owner.",
            fix: "Verify the company domain in Resend and set RESEND_FROM_EMAIL to an address on it.",
          }
        : {
            id: "RESEND",
            area: "Messages",
            label: "Email (Resend)",
            status: "ok",
            detail: `Sending as ${env.RESEND_FROM_EMAIL}.`,
          },
    set(env.STAFF_ALERT_EMAILS)
      ? {
          id: "STAFF_ALERT_EMAILS",
          area: "Messages",
          label: "Staff alerts",
          status: "ok",
          detail: "Set.",
        }
      : {
          id: "STAFF_ALERT_EMAILS",
          area: "Messages",
          label: "Staff alerts",
          status: "warn",
          detail: "Nobody is emailed about new orders or review requests.",
          fix: "Set STAFF_ALERT_EMAILS to the team's addresses, comma-separated.",
        },
    set(env.MSG91_API_KEY) && set(env.MSG91_TEMPLATE_DOCUMENT_READY)
      ? {
          id: "MSG91",
          area: "Messages",
          label: "SMS (MSG91)",
          status: "ok",
          detail: "Key and DLT template set.",
        }
      : {
          id: "MSG91",
          area: "Messages",
          label: "SMS (MSG91)",
          status: "warn",
          detail: 'SMS is off — "document ready" texts are logged, not sent.',
          fix: "After DLT registration, set MSG91_API_KEY and MSG91_TEMPLATE_DOCUMENT_READY.",
        },
    set(env.VAPID_PUBLIC_KEY) && set(env.VAPID_PRIVATE_KEY)
      ? {
          id: "VAPID",
          area: "Messages",
          label: "Browser notifications",
          status: "ok",
          detail: "VAPID keys set.",
        }
      : {
          id: "VAPID",
          area: "Messages",
          label: "Browser notifications",
          status: "warn",
          detail: "Browser push is off.",
          fix: "Generate a pair with npx web-push generate-vapid-keys and set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.",
        },
  );

  // AI
  checks.push(
    set(env.ANTHROPIC_API_KEY)
      ? {
          id: "ANTHROPIC",
          area: "AI",
          label: "Claude (assistant, AI drafting)",
          status: "ok",
          detail: `Model ${env.ANTHROPIC_MODEL || "claude-opus-5-5"}.`,
        }
      : {
          id: "ANTHROPIC",
          area: "AI",
          label: "Claude (assistant, AI drafting)",
          status: "warn",
          detail:
            "Not set — the assistant says it's offline and AI drafting is unavailable.",
          fix: "Set ANTHROPIC_API_KEY.",
        },
    set(env.VOYAGE_API_KEY)
      ? {
          id: "VOYAGE",
          area: "AI",
          label: "Voyage (catalogue search)",
          status: "ok",
          detail: `Model ${env.VOYAGE_EMBEDDING_MODEL || "voyage-4"}.`,
        }
      : {
          id: "VOYAGE",
          area: "AI",
          label: "Voyage (catalogue search)",
          status: "warn",
          detail:
            "Not set — the assistant can't search the catalogue, and AI drafts aren't modelled on library forms.",
          fix: "Set VOYAGE_API_KEY, add a payment method in Voyage (or it's limited to 3 requests a minute), then run the reindex.",
        },
  );

  // Sign-in and monitoring
  checks.push(
    set(env.GOOGLE_CLIENT_ID)
      ? {
          id: "GOOGLE_CLIENT_ID",
          area: "Sign-in",
          label: "Continue with Google",
          status: "ok",
          detail: "Set.",
        }
      : {
          id: "GOOGLE_CLIENT_ID",
          area: "Sign-in",
          label: "Continue with Google",
          status: "warn",
          detail: "Google sign-in is off; email codes still work.",
          fix: "Set GOOGLE_CLIENT_ID here and NEXT_PUBLIC_GOOGLE_CLIENT_ID on the website.",
        },
    set(env.SENTRY_DSN)
      ? {
          id: "SENTRY",
          area: "Monitoring",
          label: "Error reports (Sentry)",
          status: "ok",
          detail: `Environment ${env.SENTRY_ENVIRONMENT ?? "not named"}.`,
        }
      : {
          id: "SENTRY",
          area: "Monitoring",
          label: "Error reports (Sentry)",
          status: "warn",
          detail: "Errors are only in the server logs — nobody is alerted.",
          fix: "Set SENTRY_DSN (and SENTRY_ENVIRONMENT=production).",
        },
  );

  return checks;
}

/**
 * Refuses to start a production API with a missing or published security
 * secret: a server that boots with them would accept forged logins. Returns
 * the problems so main.ts can say exactly what to set before exiting.
 */
export function productionSecretProblems(env: Env): string[] {
  if (env.NODE_ENV !== "production") return [];
  return securityChecks(env)
    .filter((check) => check.status === "fail")
    .map((check) => `${check.detail} ${check.fix ?? ""}`.trim());
}
