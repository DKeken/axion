/**
 * LogMessagePattern decorator - automatically logs incoming message patterns
 * Reduces boilerplate in controllers
 *
 * Note: This decorator uses MethodDecorator type which preserves original method signature
 */

import { Logger } from "@nestjs/common";

/**
 * LogMessagePattern decorator - automatically logs message pattern reception
 *
 * @example
 * ```typescript
 * @LogMessagePattern(GRAPH_SERVICE_PATTERNS.CREATE_PROJECT)
 * @MessagePattern(GRAPH_SERVICE_PATTERNS.CREATE_PROJECT)
 * async createProject(@Payload() data: CreateProjectRequest) {
 *   return this.graphService.createProject(data);
 * }
 * ```
 */
export function LogMessagePattern(pattern?: string): MethodDecorator {
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
    const patternName = pattern || String(propertyKey);

    descriptor.value = async function (
      this: unknown,
      ...args: unknown[]
    ): Promise<unknown> {
      logger.log(`Received ${patternName}`);
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
