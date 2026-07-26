// Mirrors docs/srs.md Section 2 (User Roles) and Section 6 (Role x Capability Matrix).
// Any change here should be reflected back in the SRS and vice versa.
export enum Role {
  CUSTOMER = "customer",
  SUPPORT = "support",
  CONTENT_MANAGER = "content_manager",
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
}
