/**
 * Auth-specific helper functions and types for Protobuf contracts
 */

import type { ValidateSessionRequest } from "../../generated/auth/auth-service";

/**
 * HTTP input type for validate session endpoint
 * Accepts both camelCase (sessionToken) and snake_case (session_token) for backward compatibility
 */
export type ValidateSessionHttpInput = {
  sessionToken?: string;
  session_token?: string;
};

/**
 * Normalizes HTTP input to Protobuf ValidateSessionRequest format
 * Handles both camelCase and snake_case naming conventions
 */
export function normalizeValidateSessionInput(
  input: ValidateSessionHttpInput
): Pick<ValidateSessionRequest, "sessionToken"> {
  return {
    sessionToken: input.sessionToken || input.session_token || "",
  };
}
