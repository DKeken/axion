/**
 * DelegateToService decorator - replaces controller method body with a service call.
 *
 * This keeps controllers extremely small without relying on property decorators
 * (which are incompatible with strict TS settings in some workspaces).
 */

type AnyFn = (...args: any[]) => any;

export function DelegateToService(
  serviceProperty: string,
  methodName: string
): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    // Keep strict TS settings happy
    void target;
    void propertyKey;

    const originalMethod = descriptor.value;
    if (!originalMethod || typeof originalMethod !== "function") {
      return descriptor;
    }

    descriptor.value = async function (
      this: Record<string, unknown>,
      ...args: unknown[]
    ): Promise<unknown> {
      const service = this[serviceProperty] as unknown as Record<string, AnyFn>;
      const method = service?.[methodName] as AnyFn | undefined;
      if (!service || typeof method !== "function") {
        throw new Error(
          `Service method ${String(serviceProperty)}.${String(methodName)} not found`
        );
      }
      return await method.apply(service, args);
    };

    return descriptor;
  };
}
