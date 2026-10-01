import { Controller, Get, type INestApplication } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { Test } from "@nestjs/testing";
import { SkipThrottle, Throttle, ThrottlerModule } from "@nestjs/throttler";

import { AppModule } from "../../app.module";

import { THROTTLER_OPTIONS, throttlerGuardProvider } from "./throttling";

@Controller()
class ProbeController {
  @Get("strict")
  @Throttle({ default: { limit: 2, ttl: 60_000 } })
  strict() {
    return "ok";
  }

  @Get("open")
  open() {
    return "ok";
  }

  @Get("exempt")
  @SkipThrottle()
  exempt() {
    return "ok";
  }
}

/**
 * Real HTTP against a real Nest app with the production throttling config.
 * The bug this guards against was invisible at unit level: @Throttle was on
 * the routes and looked right, and nothing ever read it.
 */
describe("rate limiting", () => {
  let app: INestApplication;
  let base: string;

  const boot = async (trustedHops = 0) => {
    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot(THROTTLER_OPTIONS)],
      controllers: [ProbeController],
      providers: [throttlerGuardProvider],
    }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    if (trustedHops > 0) {
      (app as NestExpressApplication).set("trust proxy", trustedHops);
    }
    await app.listen(0, "127.0.0.1");
    base = await app.getUrl();
  };

  const hit = (path: string, headers: Record<string, string> = {}) =>
    fetch(`${base}${path}`, { headers }).then((res) => res.status);

  const hitTimes = async (path: string, times: number) => {
    const statuses: number[] = [];
    for (let i = 0; i < times; i++) statuses.push(await hit(path));
    return statuses;
  };

  afterEach(async () => {
    await app.close();
  });

  it("enforces a route's own limit with no guard on the route", async () => {
    await boot();

    expect(await hitTimes("/strict", 3)).toEqual([200, 200, 429]);
  });

  it("applies the default ceiling to every other route", async () => {
    await boot();
    const limit = (THROTTLER_OPTIONS as { limit: number }[])[0]!.limit;

    const statuses = await hitTimes("/open", limit + 1);

    expect(statuses.slice(0, limit).every((s) => s === 200)).toBe(true);
    expect(statuses.at(-1)).toBe(429);
  });

  it("never limits a route marked @SkipThrottle", async () => {
    await boot();
    const limit = (THROTTLER_OPTIONS as { limit: number }[])[0]!.limit;

    const statuses = await hitTimes("/exempt", limit + 5);

    expect(statuses.every((s) => s === 200)).toBe(true);
  });

  // Behind a proxy with trust set, two customers are two buckets.
  it("counts clients behind a trusted proxy separately", async () => {
    await boot(1);
    const as = (ip: string) => ({ "x-forwarded-for": ip });

    expect(await hit("/strict", as("203.0.113.1"))).toBe(200);
    expect(await hit("/strict", as("203.0.113.1"))).toBe(200);
    expect(await hit("/strict", as("203.0.113.1"))).toBe(429);
    // A different customer is not caught by the first one's limit.
    expect(await hit("/strict", as("198.51.100.7"))).toBe(200);
  });

  // Without trust, the header is the client's own claim and must not buy a
  // fresh bucket — otherwise any limit is one header away from useless.
  it("ignores a forged X-Forwarded-For when no proxy is trusted", async () => {
    await boot(0);

    expect(await hit("/strict", { "x-forwarded-for": "10.0.0.1" })).toBe(200);
    expect(await hit("/strict", { "x-forwarded-for": "10.0.0.2" })).toBe(200);
    expect(await hit("/strict", { "x-forwarded-for": "10.0.0.3" })).toBe(429);
  });
});

/** The wiring itself, so removing the guard can't pass unnoticed. */
describe("AppModule", () => {
  it("registers the throttler guard app-wide", () => {
    const providers = Reflect.getMetadata("providers", AppModule) as unknown[];

    expect(providers).toContain(throttlerGuardProvider);
  });
});
