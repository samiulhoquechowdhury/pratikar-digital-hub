import { BadRequestException, Injectable } from "@nestjs/common";
import { normalizeIndianMobile } from "@pratikar/types";

import { msg91Number } from "../notifications/sms.service";

import { IntegrationsService } from "./integrations.service";

export interface TestResult {
  ok: boolean;
  message: string;
}

const TIMEOUT_MS = 15_000;

/** The response's own message, when the service sent one. */
async function reason(response: Response): Promise<string> {
  const body = await response.text().catch(() => "");
  try {
    const parsed = JSON.parse(body) as Record<string, unknown>;
    const error = parsed.error as Record<string, unknown> | string | undefined;
    const message =
      parsed.message ??
      (typeof error === "object"
        ? (error.description ?? error.message)
        : error);
    if (typeof message === "string" && message) return message.slice(0, 200);
  } catch {
    // Not JSON.
  }
  return `HTTP ${response.status}`;
}

/**
 * "Test connection" for each service: one cheap, read-only call with the
 * keys currently in use, so a wrong or expired key shows up here rather
 * than as a customer's failed payment. MSG91 is the exception — the only
 * proof an SMS key works is an SMS — so it sends one to a number the admin
 * gives.
 */
@Injectable()
export class IntegrationsTester {
  constructor(private readonly integrations: IntegrationsService) {}

  async test(id: string, phone?: string): Promise<TestResult> {
    const get = (key: Parameters<IntegrationsService["get"]>[0]) =>
      this.integrations.get(key);
    try {
      switch (id) {
        case "msg91":
          return await this.msg91(
            get("MSG91_API_KEY"),
            get("MSG91_TEMPLATE_LOGIN_OTP"),
            phone,
          );
        case "resend":
          return await this.call(
            "https://api.resend.com/domains",
            { Authorization: `Bearer ${get("RESEND_API_KEY")}` },
            "Resend accepted the API key.",
            !get("RESEND_API_KEY"),
          );
        case "razorpay":
          return await this.call(
            "https://api.razorpay.com/v1/orders?count=1",
            {
              Authorization: `Basic ${Buffer.from(
                `${get("RAZORPAY_KEY_ID")}:${get("RAZORPAY_KEY_SECRET")}`,
              ).toString("base64")}`,
            },
            get("RAZORPAY_KEY_ID").startsWith("rzp_test_")
              ? "Razorpay accepted the keys (test mode — no real money moves)."
              : "Razorpay accepted the keys.",
            !get("RAZORPAY_KEY_ID") || !get("RAZORPAY_KEY_SECRET"),
          );
        case "anthropic":
          return await this.call(
            "https://api.anthropic.com/v1/models?limit=1",
            {
              "x-api-key": get("ANTHROPIC_API_KEY"),
              "anthropic-version": "2023-06-01",
            },
            "Anthropic accepted the API key. (It doesn't check the account has credit.)",
            !get("ANTHROPIC_API_KEY"),
          );
        case "voyage":
          return await this.voyage(
            get("VOYAGE_API_KEY"),
            get("VOYAGE_EMBEDDING_MODEL"),
          );
        default:
          throw new BadRequestException("NOT_TESTABLE");
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      return {
        ok: false,
        message: `Couldn't reach the service: ${(error as Error).message}`,
      };
    }
  }

  private async call(
    url: string,
    headers: Record<string, string>,
    success: string,
    missing: boolean,
  ): Promise<TestResult> {
    if (missing) return { ok: false, message: "Enter the keys first." };
    const response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return response.ok
      ? { ok: true, message: success }
      : { ok: false, message: `Refused: ${await reason(response)}` };
  }

  private async voyage(apiKey: string, model: string): Promise<TestResult> {
    if (!apiKey) return { ok: false, message: "Enter the API key first." };
    const response = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input: ["test"], model: model || "voyage-3.5" }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return response.ok
      ? { ok: true, message: "Voyage accepted the API key." }
      : { ok: false, message: `Refused: ${await reason(response)}` };
  }

  private async msg91(
    authKey: string,
    templateId: string,
    phone?: string,
  ): Promise<TestResult> {
    if (!authKey || !templateId) {
      return {
        ok: false,
        message: "Enter the auth key and the sign-in template ID first.",
      };
    }
    const number = phone ? normalizeIndianMobile(phone) : null;
    if (!number) throw new BadRequestException("INVALID_PHONE");
    const response = await fetch("https://control.msg91.com/api/v5/flow", {
      method: "POST",
      headers: { authkey: authKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        template_id: templateId,
        short_url: "0",
        recipients: [
          { mobiles: msg91Number(number), otp: "123456", minutes: "10" },
        ],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    // MSG91 can answer 200 with { type: "error" }, so the body decides.
    const body = (await response.json().catch(() => ({}))) as {
      type?: string;
      message?: string;
    };
    return response.ok && body.type !== "error"
      ? {
          ok: true,
          message: `MSG91 accepted it. A test code (123456) is on its way to ${number}.`,
        }
      : {
          ok: false,
          message: `Refused: ${body.message ?? `HTTP ${response.status}`}`,
        };
  }
}
