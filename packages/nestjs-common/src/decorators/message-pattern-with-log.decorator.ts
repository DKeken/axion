/**
 * MessagePatternWithLog decorator - combines MessagePattern and LogMessagePattern
 * Reduces boilerplate in controllers by combining both decorators into one
 *
 * @example
 * ```typescript
 * @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.CREATE_PROJECT)
 * async createProject(@Payload() data: CreateProjectRequest) {
 *   return this.graphService.createProject(data);
 * }
 * ```
 */

import { Logger } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";

/**
 * MessagePatternWithLog decorator - combines MessagePattern and automatic logging.
 *
 * Note: kept as a **method decorator** to remain compatible with strict TS settings
 * across all services.
 */
export function MessagePatternWithLog(pattern: string): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    // Apply MessagePattern decorator (Nest stores metadata by propertyKey)
    MessagePattern(pattern)(target, propertyKey, descriptor);

    const originalMethod = descriptor.value;
    if (!originalMethod || typeof originalMethod !== "function") {
      return descriptor;
    }

    const className =
      typeof target === "function"
        ? target.name
        : target?.constructor?.name || "Unknown";
    const logger = new Logger(className);

    descriptor.value = async function (
      this: unknown,
      ...args: unknown[]
    ): Promise<unknown> {
      logger.log(`Received ${pattern}`);
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
