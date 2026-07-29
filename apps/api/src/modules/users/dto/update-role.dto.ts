import { Role } from "@pratikar/types";
import { IsIn } from "class-validator";

/**
 * The role value previously reached Prisma straight off @Body("role") with no
 * validation — an unknown string got as far as the database driver, and the
 * resulting error surfaced as a 500 rather than a 400.
 */
export class UpdateRoleDto {
  @IsIn(Object.values(Role))
  role!: Role;
}
