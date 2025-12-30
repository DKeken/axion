/**
 * @axion/shared - Shared utilities and helpers for Axion Stack
 *
 * This package contains reusable utilities that are not specific to contracts
 * but are used across multiple microservices.
 */

// Export helpers
export * from "./helpers/index";

// Export error handling system
export * from "./errors/index";

// Export utilities
export * from "./utils/index";

// Export base services
export * from "./services/base-service";

// Export SAFE Kafka utilities (safe for frontend)
export * from "./kafka/headers";
export * from "./kafka/headers-converter";
export * from "./kafka/dlq";
export * from "./kafka/retry-policy";
export * from "./kafka/idempotency";
export * from "./kafka/types";
