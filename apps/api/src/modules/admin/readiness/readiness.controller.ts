import { Controller, Get, HttpStatus, Res, UseGuards } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { Role } from "@pratikar/types";
import type { Response } from "express";

import { Roles } from "../../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";

import { ReadinessService } from "./readiness.service";

/**
 * For the platform's health check (Railway's healthcheckPath): 200 when the
 * database and Redis answer, 503 when either doesn't. Public, so it says
 * nothing beyond up or down — the details are on the admin checklist.
 */
@Controller("health")
@SkipThrottle()
export class HealthController {
  constructor(private readonly readiness: ReadinessService) {}

  @Get()
  async health(@Res() res: Response) {
    const { database, redis } = await this.readiness.health();
    const up = database && redis;
    res
      .status(up ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE)
      .json({ status: up ? "ok" : "degraded" });
  }
}

/** The launch checklist. Admins only: it describes the whole configuration. */
@Controller("admin/readiness")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class ReadinessController {
  constructor(private readonly readiness: ReadinessService) {}

  @Get()
  report() {
    return this.readiness.report();
  }
}
