import {
  configChecks,
  DEV_SECRET,
  productionSecretProblems,
} from "./config-checks";

const SECRET = "a".repeat(64);

/** A fully configured production environment. */
const LIVE = {
  NODE_ENV: "production",
  JWT_ACCESS_SECRET: SECRET,
  OTP_HMAC_SECRET: SECRET,
  STORAGE_URL_SECRET: SECRET,
  PUBLIC_SITE_URL: "https://pratikar.in",
  ADMIN_SITE_URL: "https://admin.pratikar.in",
  PUBLIC_API_URL: "https://api.pratikar.in",
  ALLOWED_ORIGINS: "https://pratikar.in,https://admin.pratikar.in",
  TRUST_PROXY_HOPS: "1",
  R2_ACCOUNT_ID: "acc",
  R2_BUCKET: "pratikar",
  R2_ACCESS_KEY_ID: "k",
  R2_SECRET_ACCESS_KEY: "s",
  RAZORPAY_KEY_ID: "rzp_live_abc",
  RAZORPAY_KEY_SECRET: "s",
  RAZORPAY_WEBHOOK_SECRET: "w",
  COMPANY_LEGAL_NAME: "Pratikar Digital Hub Pvt Ltd",
  COMPANY_GSTIN: "19ABCDE1234F1Z5",
  COMPANY_ADDRESS: "Kolkata",
  COMPANY_STATE_CODE: "19",
  RESEND_API_KEY: "re_x",
  RESEND_FROM_EMAIL: "hello@pratikar.in",
  STAFF_ALERT_EMAILS: "team@pratikar.in",
  MSG91_API_KEY: "m",
  MSG91_TEMPLATE_DOCUMENT_READY: "t",
  VAPID_PUBLIC_KEY: "p",
  VAPID_PRIVATE_KEY: "q",
  ANTHROPIC_API_KEY: "sk",
  VOYAGE_API_KEY: "v",
  GOOGLE_CLIENT_ID: "g",
  SENTRY_DSN: "https://sentry",
};

const statusOf = (env: Record<string, string | undefined>, id: string) =>
  configChecks(env).find((check) => check.id === id)?.status;

describe("configChecks", () => {
  it("passes a fully configured production environment", () => {
    const failing = configChecks(LIVE).filter((c) => c.status !== "ok");
    expect(failing).toEqual([]);
  });

  it("never puts a secret's value in a check", () => {
    const text = JSON.stringify(configChecks(LIVE));
    expect(text).not.toContain(SECRET);
    expect(text).not.toContain("rzp_live_abc");
  });

  it("fails a secret left at the published development value", () => {
    expect(
      statusOf({ ...LIVE, JWT_ACCESS_SECRET: DEV_SECRET }, "JWT_ACCESS_SECRET"),
    ).toBe("fail");
    expect(
      statusOf({ ...LIVE, OTP_HMAC_SECRET: undefined }, "OTP_HMAC_SECRET"),
    ).toBe("fail");
    expect(
      statusOf({ ...LIVE, STORAGE_URL_SECRET: "short" }, "STORAGE_URL_SECRET"),
    ).toBe("fail");
  });

  it("fails addresses that point at localhost or plain http", () => {
    expect(
      statusOf(
        { ...LIVE, PUBLIC_SITE_URL: "http://localhost:3000" },
        "PUBLIC_SITE_URL",
      ),
    ).toBe("fail");
    expect(
      statusOf(
        { ...LIVE, PUBLIC_API_URL: "http://api.pratikar.in" },
        "PUBLIC_API_URL",
      ),
    ).toBe("fail");
    expect(
      statusOf(
        {
          ...LIVE,
          ALLOWED_ORIGINS: "https://pratikar.in,http://localhost:3001",
        },
        "ALLOWED_ORIGINS",
      ),
    ).toBe("warn");
  });

  it("warns about Razorpay test keys, and fails missing ones", () => {
    expect(
      statusOf({ ...LIVE, RAZORPAY_KEY_ID: "rzp_test_abc" }, "RAZORPAY"),
    ).toBe("warn");
    expect(statusOf({ ...LIVE, RAZORPAY_WEBHOOK_SECRET: "" }, "RAZORPAY")).toBe(
      "fail",
    );
  });

  it("fails Resend's test sender, which only reaches the account owner", () => {
    expect(
      statusOf(
        { ...LIVE, RESEND_FROM_EMAIL: "onboarding@resend.dev" },
        "RESEND",
      ),
    ).toBe("fail");
  });

  // Every invoice would carry the wrong CGST/SGST/IGST split.
  it("fails a GSTIN whose state disagrees with the company's state", () => {
    expect(statusOf({ ...LIVE, COMPANY_STATE_CODE: "27" }, "INVOICE")).toBe(
      "fail",
    );
    expect(statusOf({ ...LIVE, COMPANY_GSTIN: "NOT-A-GSTIN" }, "INVOICE")).toBe(
      "fail",
    );
  });

  it("fails storage without R2, whose files would vanish on redeploy", () => {
    expect(statusOf({ ...LIVE, R2_BUCKET: undefined }, "R2")).toBe("fail");
    // The older variable names are still read.
    expect(
      statusOf(
        { ...LIVE, R2_ACCESS_KEY_ID: undefined, R2_ACCESS_KEY: "k" },
        "R2",
      ),
    ).toBe("ok");
  });

  it("only warns for features that can be switched on later", () => {
    for (const id of [
      "MSG91",
      "VAPID",
      "ANTHROPIC",
      "VOYAGE",
      "SENTRY",
      "GOOGLE_CLIENT_ID",
    ]) {
      const env: Record<string, string | undefined> = { ...LIVE };
      for (const key of Object.keys(env)) {
        if (key.startsWith(id.split("_")[0]!)) env[key] = undefined;
      }
      expect([id, statusOf(env, id)]).toEqual([id, "warn"]);
    }
  });
});

describe("productionSecretProblems", () => {
  it("lists missing and published secrets in production", () => {
    const problems = productionSecretProblems({
      NODE_ENV: "production",
      JWT_ACCESS_SECRET: DEV_SECRET,
      OTP_HMAC_SECRET: SECRET,
    });
    expect(problems).toHaveLength(2);
    expect(problems.join(" ")).toMatch(/JWT_ACCESS_SECRET/);
    expect(problems.join(" ")).toMatch(/STORAGE_URL_SECRET/);
  });

  // Development runs on the defaults on purpose.
  it("never stops a development server", () => {
    expect(productionSecretProblems({ NODE_ENV: "development" })).toEqual([]);
    expect(productionSecretProblems({})).toEqual([]);
  });

  it("passes production with every secret set", () => {
    expect(productionSecretProblems(LIVE)).toEqual([]);
  });
});
