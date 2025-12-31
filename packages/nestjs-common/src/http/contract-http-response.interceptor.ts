import { isErrorResponse, isSuccessResponse } from "@axion/contracts";
import type { Error as AxionError } from "@axion/contracts";
import type { CallHandler, ExecutionContext } from "@nestjs/common";
import { Injectable, NestInterceptor } from "@nestjs/common";
import type { Observable } from "rxjs";
import { tap } from "rxjs/operators";

import { mapContractErrorToHttpStatus } from "./error-to-http-status";

export type ResponseWithOneof<T> = {
  result:
    | { case: "success" | "data"; value: T }
    | { case: "error"; value: AxionError }
    | { case: undefined; value?: undefined }
    | { case: string; value: unknown };
};

/**
 * If a handler returns an @axion/contracts response envelope, set HTTP status:
 * - success → 200 (unless already set)
 * - error   → mapped status (400/401/403/404/…)
 *
 * Body is preserved as-is (protobuf-compatible envelope).
 */
@Injectable()
export class ContractHttpResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") {
      return next.handle();
    }

    const res = context.switchToHttp().getResponse<{
      statusCode?: number;
      status: (code: number) => void;
    }>();

    return next.handle().pipe(
      tap((value) => {
        // Safe cast to unknown first to avoid structural typing issues
        const response = value as
          | { result?: { case: string | undefined; value: unknown } }
          | undefined;
        if (!response || typeof response !== "object") return;

        if (isErrorResponse(response)) {
          const error = response.result.value;
          if (error) {
            res.status(mapContractErrorToHttpStatus(error));
          } else {
            res.status(500);
          }
          return;
        }

        // We use 'as any' here because generic T is hard to match at runtime
        if (isSuccessResponse<unknown>(response)) {
          // Keep any explicit status set by the handler.
          // (Express defaults to 200 anyway, but we normalize for other adapters.)
          if (typeof res.statusCode === "number" && res.statusCode >= 400) {
            res.status(200);
          }
        }
      })
    );
  }
}
