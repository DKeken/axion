import {
  BadRequestException,
  Injectable,
  type PipeTransform,
} from "@nestjs/common";
import typia from "typia";

import {
  DEFAULT_ERROR_MESSAGE,
  type TypiaAssert,
  type TypiaGuard,
  type TypiaMode,
  type TypiaValidate,
  type ValidationErrorPayload,
} from "./typia-types";

/**
 * NestJS pipe for Typia runtime validation.
 *
 * - `assert` mode throws on first error.
 * - `validate` mode collects errors and returns data when successful.
 */
@Injectable()
export class TypiaValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(
    private readonly guard: TypiaGuard<T>,
    private readonly mode: TypiaMode = "assert",
    private readonly errorMessage: string = DEFAULT_ERROR_MESSAGE
  ) {}

  transform(value: unknown): T {
    if (this.mode === "validate") {
      const validateGuard: TypiaValidate<T> = this.guard as TypiaValidate<T>;
      const result = validateGuard(value);
      if (!result.success) {
        throw new BadRequestException(this.buildErrorPayload(result.errors));
      }
      return result.data;
    }

    try {
      const assertGuard: TypiaAssert<T> = this.guard as TypiaAssert<T>;
      assertGuard(value);
      return value as T;
    } catch (error) {
      throw new BadRequestException(this.buildErrorPayload());
    }
  }

  private buildErrorPayload(
    errors?: typia.IValidation.IError[]
  ): ValidationErrorPayload {
    return errors
      ? { message: this.errorMessage, errors }
      : { message: this.errorMessage };
  }
}

export const createTypiaAssertPipe = <T>(options?: {
  errorMessage?: string;
}): TypiaValidationPipe<T> =>
  new TypiaValidationPipe<T>(
    typia.createAssert<T>(),
    "assert",
    options?.errorMessage
  );

export const createTypiaValidatePipe = <T>(options?: {
  errorMessage?: string;
}): TypiaValidationPipe<T> =>
  new TypiaValidationPipe<T>(
    typia.createValidate<T>(),
    "validate",
    options?.errorMessage
  );
