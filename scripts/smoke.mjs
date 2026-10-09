#!/usr/bin/env node
/**
 * Smoke test for a deployed environment — run it right after a deploy, and
 * before announcing a launch:
 *
 *   pnpm smoke https://api.pratikar.in https://pratikar.in
 *   pnpm smoke http://localhost:4000 http://localhost:3002   # local
 *
 * Checks, from the outside, what a customer's browser depends on: the API
 * is up and talks to the site (CORS), the catalogue loads, and the site's
 * pages, sitemap and app files are served. With ADMIN_TOKEN set (an admin's
 * access token) it also prints the API's full launch checklist.
 *
 * No dependencies — Node 20's fetch. Exits 1 if anything failed.
 */

const [apiArg, siteArg] = process.argv.slice(2);
if (!apiArg || !siteArg) {
  console.error("Usage: pnpm smoke <api-url> <site-url>");
  process.exit(2);
}
const API = apiArg.replace(/\/+$/, "");
const SITE = siteArg.replace(/\/+$/, "");
const TIMEOUT_MS = 30_000;

const results = [];
const record = (status, label, detail = "") => {
  results.push({ status, label, detail });
  const mark = {
    ok: "\x1b[32m✓\x1b[0m",
    warn: "\x1b[33m!\x1b[0m",
    fail: "\x1b[31m✕\x1b[0m",
  }[status];
  console.log(`${mark} ${label}${detail ? `  — ${detail}` : ""}`);
};

async function get(url, init = {}) {
  return fetch(url, {
    ...init,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    redirect: "manual",
  });
}

/** Runs one check; a thrown error is a failure with its message. */
async function check(label, fn) {
  try {
    const outcome = await fn();
    if (outcome === undefined || outcome === true) record("ok", label);
    else record(outcome.status, label, outcome.detail);
  } catch (error) {
    record(
      "fail",
      label,
      error instanceof Error ? error.message : String(error),
    );
  }
}

const expectStatus = async (url, wanted = 200, init) => {
  const res = await get(url, init);
  if (res.status !== wanted)
    throw new Error(`${url} answered ${res.status}, expected ${wanted}`);
  return res;
};

console.log(`\nAPI:  ${API}\nSite: ${SITE}\n`);

for (const [name, url] of [
  ["API", API],
  ["Site", SITE],
]) {
  if (
    !url.startsWith("https://") &&
    !/\/\/(localhost|127\.0\.0\.1)/.test(url)
  ) {
    record("fail", `${name} address uses https`, `${url} is plain http`);
  }
}

// ---- API
await check("API is up (/health)", async () => {
  const res = await expectStatus(`${API}/health`);
  const body = await res.json();
  if (body.status !== "ok") throw new Error(`status ${body.status}`);
});
await check("Site may call the API (CORS)", async () => {
  const res = await get(`${API}/documents/templates`, {
    method: "OPTIONS",
    headers: {
      Origin: SITE,
      "Access-Control-Request-Method": "GET",
    },
  });
  const allowed = res.headers.get("access-control-allow-origin");
  if (allowed !== SITE) {
    throw new Error(
      `allows ${allowed ?? "no origin"} — add ${SITE} to ALLOWED_ORIGINS`,
    );
  }
});
await check("Document templates load", async () => {
  const res = await expectStatus(`${API}/documents/templates`);
  const list = await res.json();
  if (!Array.isArray(list) || list.length === 0)
    return { status: "warn", detail: "none published" };
  return { status: "ok", detail: `${list.length} published` };
});
await check("Library loads", async () => {
  const res = await expectStatus(`${API}/content-library`);
  const list = await res.json();
  const count = Array.isArray(list)
    ? list.length
    : Array.isArray(list?.items)
      ? list.items.length
      : 0;
  return count > 0
    ? { status: "ok", detail: `${count} items` }
    : { status: "warn", detail: "empty" };
});
await check("Assistant", async () => {
  const res = await expectStatus(`${API}/ai/status`);
  const { assistant } = await res.json();
  return assistant
    ? { status: "ok", detail: "live" }
    : {
        status: "warn",
        detail: "offline — no ANTHROPIC_API_KEY or VOYAGE_API_KEY",
      };
});
await check("Push notifications key", async () => {
  const res = await expectStatus(`${API}/notifications/push/key`);
  const { publicKey } = await res.json();
  return publicKey
    ? true
    : { status: "warn", detail: "push is off — no VAPID keys" };
});
await check("Custom drafting", async () => {
  const res = await expectStatus(`${API}/documents/custom/pricing`);
  const { available, reviewPriceInPaise } = await res.json();
  return available
    ? {
        status: "ok",
        detail: `review ₹${(reviewPriceInPaise / 100).toFixed(2)} + GST`,
      }
    : { status: "warn", detail: "unavailable — no ANTHROPIC_API_KEY" };
});

// ---- Site
for (const path of [
  "/",
  "/documents",
  "/documents/custom",
  "/content-library",
  "/assistant",
  "/verify",
  "/terms",
  "/privacy",
  "/refunds",
  "/delivery",
]) {
  await check(`Page ${path}`, () =>
    expectStatus(`${SITE}${path}`).then(() => true),
  );
}
await check("sitemap.xml", async () => {
  const res = await expectStatus(`${SITE}/sitemap.xml`);
  const xml = await res.text();
  if (!xml.includes(SITE)) {
    return {
      status: "warn",
      detail:
        "its links don't use this address — check the site's public URL setting",
    };
  }
});
await check("robots.txt", () =>
  expectStatus(`${SITE}/robots.txt`).then(() => true),
);
await check("App manifest (Add to Home Screen)", () =>
  expectStatus(`${SITE}/manifest.webmanifest`).then(() => true),
);
await check("Service worker (push)", async () => {
  const res = await expectStatus(`${SITE}/sw.js`);
  const type = res.headers.get("content-type") ?? "";
  if (!type.includes("javascript")) throw new Error(`served as ${type}`);
});

// ---- The API's own launch checklist
if (process.env.ADMIN_TOKEN) {
  await check("Launch checklist (admin)", async () => {
    const res = await get(`${API}/admin/readiness`, {
      headers: { Authorization: `Bearer ${process.env.ADMIN_TOKEN}` },
    });
    if (res.status !== 200)
      throw new Error(
        `answered ${res.status} — is ADMIN_TOKEN an admin's current token?`,
      );
    const report = await res.json();
    for (const item of report.checks.filter((c) => c.status !== "ok")) {
      console.log(
        `    ${item.status === "fail" ? "✕" : "!"} ${item.area} · ${item.label}: ${item.detail}`,
      );
    }
    return report.ready
      ? {
          status: "ok",
          detail: `${report.summary.ok} pass, ${report.summary.warn} optional off`,
        }
      : {
          status: "fail",
          detail: `${report.summary.fail} must be fixed (listed above)`,
        };
  });
} else {
  console.log(
    "\n(Set ADMIN_TOKEN to an admin's access token to include the full launch checklist.)",
  );
}

const failed = results.filter((r) => r.status === "fail").length;
const warned = results.filter((r) => r.status === "warn").length;
console.log(
  `\n${failed === 0 ? "\x1b[32mPASS\x1b[0m" : "\x1b[31mFAIL\x1b[0m"} — ${results.length - failed - warned} ok, ${warned} warnings, ${failed} failed\n`,
);
process.exit(failed === 0 ? 0 : 1);
