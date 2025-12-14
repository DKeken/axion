/**
 * Unified error handling system for Axion Stack
 * Simple, minimal, reusable error handling
 */

// Error codes
export * from "./error-codes";

// Error classes
export * from "./service-errors";

// Main error handler - use this in services
export {
  handleServiceError,
  getErrorMessage,
  getUserFriendlyMessage,
} from "./error-handler";
