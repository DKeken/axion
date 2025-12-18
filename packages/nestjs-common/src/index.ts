/**
 * @axion/nestjs-common - Common NestJS utilities for Axion Stack microservices
 *
 * This package provides reusable NestJS modules, guards, and utilities
 * for microservices in the Axion Stack.
 *
 * It does NOT include better-auth UI components, which are in @axion/better-auth/ui
 */

// Auth module
export * from "./auth";

// Decorators
export * from "./decorators";

// Controllers
export * from "./controllers/base-controller";

// Health module
export * from "./health/health.module";

// BullMQ module
export * from "./bullmq";

// SSH module
export * from "./ssh";

// HTTP helpers (public API layer)
export * from "./http";

// Bootstrap
export * from "./bootstrap/bootstrap";
