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

import { MessagePattern } from "@nestjs/microservices";
import { Logger } from "@nestjs/common";

/**
 * MessagePatternWithLog decorator - combines MessagePattern and automatic logging
 *
 * Automatically:
 * - Registers the message pattern handler
 * - Logs incoming messages with pattern name
 *
 * @param pattern - Message pattern string (from @axion/contracts)
 * @returns Method decorator that combines both functionalities
 */
export function MessagePatternWithLog(pattern: string): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    // Apply MessagePattern decorator
    MessagePattern(pattern)(target, propertyKey, descriptor);

    // Add logging functionality
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
