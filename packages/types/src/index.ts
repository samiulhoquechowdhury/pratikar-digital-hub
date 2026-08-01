// Shared, framework-agnostic types used by web, admin, and api.
// Keep this package free of any runtime dependency (no NestJS/React imports) —
// it should be importable from any workspace without pulling in a framework.

export * from "./roles";
export * from "./auth";
export * from "./documents";
export * from "./catalogue";
export * from "./assessments";
