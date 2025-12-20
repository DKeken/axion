import typia from "typia";

export type TypiaAssert<T> = (input: unknown) => asserts input is T;
export type TypiaValidate<T> = (input: unknown) => typia.IValidation<T>;

export type TypiaGuard<T> = TypiaAssert<T> | TypiaValidate<T>;

export type TypiaMode = "assert" | "validate";

export interface ValidationErrorPayload {
  message: string;
  errors?: typia.IValidation.IError[];
}

export const DEFAULT_ERROR_MESSAGE = "Validation failed";
