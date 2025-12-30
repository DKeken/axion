/**
 * Helper function to create a controller method that delegates to a service
 * Reduces boilerplate by eliminating repetitive delegation code
 *
 * @example
 * ```typescript
 * @Controller()
 * @UseGuards(MicroserviceAuthGuard)
 * export class GraphController {
 *   constructor(private readonly graphService: GraphService) {}
 *
 *   @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.CREATE_PROJECT)
 *   createProject = delegateToService("graphService", "createProject");
 * }
 * ```
 *
 * Note: This is a simple helper - for more complex cases, use explicit methods
 */
type AnyFn = (...args: unknown[]) => unknown;

/**
 * Delegate controller handler to a service method.
 *
 * We intentionally accept string keys to support `private readonly fooService`
 * constructor params (private members are not part of `keyof` in TS).
 */
export function delegateToService<TArgs extends unknown[], TResult>(
  serviceProperty: string,
  methodName: string
): (...args: TArgs) => Promise<TResult> {
  const resultFn = async function (
    this: Record<string, unknown>,
    ...args: unknown[]
  ) {
    const service = this[serviceProperty] as unknown as Record<string, AnyFn>;
    const method = service?.[methodName] as AnyFn | undefined;

    if (!service || typeof method !== "function") {
      throw new Error(
        `Service method ${String(serviceProperty)}.${String(methodName)} not found`
      );
    }

    return await method.apply(service, args);
  };

  return resultFn as (...args: TArgs) => Promise<TResult>;
}
