import { SetMetadata } from "@nestjs/common";
import type { Role } from "@pratikar/types";

export const ROLES_KEY = "roles";

/** Usage: @Roles(Role.ADMIN, Role.SUPER_ADMIN) on a controller method. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
