import { createParamDecorator, type ExecutionContext } from "@nestjs/common";

import type {
  AuthenticatedRequest,
  RequestUser,
} from "../types/authenticated-request";

export type { RequestUser };

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    // Non-null: every route using @CurrentUser is behind JwtAuthGuard, which
    // either sets `user` or throws before the handler runs.
    return request.user!;
  },
);
