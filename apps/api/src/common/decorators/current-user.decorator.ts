import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { Role } from "@pratikar/types";

export interface RequestUser {
  id: string;
  role: Role;
}

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): RequestUser => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
