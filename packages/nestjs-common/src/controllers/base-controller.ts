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
export function delegateToService<TService>(
  serviceProperty: keyof TService,
  methodName: keyof TService[typeof serviceProperty]
) {
  return async function (this: TService, data: unknown) {
    const service = this[serviceProperty] as Record<
      string,
      (data: unknown) => Promise<unknown>
    >;
    if (!service || typeof service[methodName as string] !== "function") {
      throw new Error(
        `Service method ${String(serviceProperty)}.${String(methodName)} not found`
      );
    }
    return service[methodName as string](data);
  };
}
