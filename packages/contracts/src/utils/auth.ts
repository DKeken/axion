import { create } from "@bufbuild/protobuf";
import { timestampFromDate } from "@bufbuild/protobuf/wkt";
import {
  type ValidateSessionResponse,
  ValidateSessionResponseSchema,
  type Session,
  type User,
  SessionValidationSchema,
  SessionSchema,
  UserSchema,
} from "../../generated/auth/session_pb";
import { ErrorSchema, ErrorCode } from "../../generated/common/errors_pb";

/**
 * HTTP input type for validate session (for backwards compatibility)
 */
export type ValidateSessionHttpInput = {
  sessionToken?: string;
  session_token?: string;
};

/**
 * Normalize HTTP input to Protobuf format
 */
export function normalizeValidateSessionInput(
  input: ValidateSessionHttpInput
): { sessionToken: string } {
  return {
    sessionToken: input.sessionToken || input.session_token || "",
  };
}

/**
 * Session input type (with Date instead of Timestamp for convenience)
 * Omits Message internal fields and replaces Timestamp fields with Date
 */
export type SessionInput = Omit<
  Session,
  "$typeName" | "$unknown" | "expiresAt" | "createdAt"
> & {
  expiresAt: Date;
  createdAt?: Date;
};

/**
 * User input type (with Date instead of Timestamp for convenience)
 * Omits Message internal fields and replaces Timestamp fields with Date
 */
export type UserInput = Omit<
  User,
  "$typeName" | "$unknown" | "createdAt" | "updatedAt"
> & {
  createdAt?: Date;
  updatedAt?: Date;
};

/**
 * Create a successful session validation response
 */
export function createSessionValidationSuccess(
  session: SessionInput,
  user: UserInput
): ValidateSessionResponse {
  return create(ValidateSessionResponseSchema, {
    result: {
      case: "validation",
      value: create(SessionValidationSchema, {
        valid: true,
        session: create(SessionSchema, {
          id: session.id,
          userId: session.userId,
          token: session.token || "",
          expiresAt: timestampFromDate(session.expiresAt),
          createdAt: session.createdAt
            ? timestampFromDate(session.createdAt)
            : undefined,
          metadata: session.metadata || {},
        }),
        user: create(UserSchema, {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt
            ? timestampFromDate(user.createdAt)
            : undefined,
          updatedAt: user.updatedAt
            ? timestampFromDate(user.updatedAt)
            : undefined,
        }),
      }),
    },
  });
}

/**
 * Create a session validation error response
 */
export function createSessionValidationError(
  code: string,
  message: string,
  details?: Record<string, string>
): ValidateSessionResponse {
  return create(ValidateSessionResponseSchema, {
    result: {
      case: "error",
      value: create(ErrorSchema, {
        code: ErrorCode.UNAUTHORIZED,
        message,
        field: code,
        metadata: details || {},
      }),
    },
  });
}
