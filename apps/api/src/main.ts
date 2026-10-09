import "reflect-metadata";
// Before everything else, so error monitoring sees the modules as they load.
import "./instrument";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";

import { AppModule } from "./app.module";
import { parseTrustProxyHops } from "./common/http/trust-proxy";
import { productionSecretProblems } from "./modules/admin/readiness/config-checks";

async function bootstrap() {
  // A production API with a missing or published security secret would
  // accept forged logins and download links. Refuse to start rather than
  // serve like that; the message says exactly what to set.
  const problems = productionSecretProblems(process.env);
  if (problems.length > 0) {
    // eslint-disable-next-line no-console
    console.error(
      `Refusing to start in production:\n- ${problems.join("\n- ")}`,
    );
    process.exit(1);
  }

  // rawBody keeps the unparsed request bytes on req.rawBody. The Razorpay
  // webhook signature is an HMAC over exactly those bytes, so verifying
  // against a re-serialised copy of the parsed body would fail on any
  // difference in key order or unicode escaping.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  // Makes req.ip the client rather than the proxy, which every per-IP limit
  // depends on. Parsed and bounded — see trust-proxy.ts for why a wrong
  // value is worse than none.
  const trustedHops = parseTrustProxyHops(process.env.TRUST_PROXY_HOPS);
  if (trustedHops > 0) app.set("trust proxy", trustedHops);

  app.use(cookieParser()); // required for req.cookies (refresh token) in AuthController

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown DTO fields
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") ?? [
      "http://localhost:3000",
    ],
    credentials: true, // required for the httpOnly refresh-token cookie
  });

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API listening on :${port}`);
}

void bootstrap();
