/**
 * CatchError decorator for automatic error handling in service methods
 * Reduces boilerplate by automatically wrapping methods with try-catch
 *
 * Note: This decorator uses MethodDecorator type which preserves original method signature
 */

import { handleServiceError } from "@axion/shared";
import type { ErrorContext } from "@axion/shared";
import { Logger } from "@nestjs/common";

/**
 * Options for CatchError decorator
 */
export type CatchErrorOptions = {
  /**
   * Operation name for logging (defaults to method name)
   */
  operation?: string;
  /**
   * Additional error context
   */
  context?: ErrorContext;
}

/**
 * CatchError decorator - automatically handles errors in service methods
 *
 * @example
 * ```typescript
 * @CatchError({ operation: "creating project" })
 * async create(data: CreateProjectRequest) {
 *   // No need for try-catch
 *   const project = await this.repository.create(data);
 *   return createSuccessResponse(project);
 * }
 * ```
 */
export function CatchError(options?: CatchErrorOptions): MethodDecorator {
  return function (
    target: unknown,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    if (!originalMethod || typeof originalMethod !== "function") {
      return descriptor;
    }

    const className =
      typeof target === "function"
        ? target.name
        : target?.constructor?.name || "Unknown";
    const logger = new Logger(className);
    const operation = options?.operation || String(propertyKey);

    descriptor.value = async function (
      this: unknown,
      ...args: unknown[]
    ): Promise<unknown> {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        return handleServiceError(logger, operation, error, options?.context);
      }
    };

    return descriptor;
  };
}
