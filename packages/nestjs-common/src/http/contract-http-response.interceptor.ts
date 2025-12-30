import { isErrorResponse, isSuccessResponse } from "@axion/contracts";
import type { ResponseWithOneof } from "@axion/contracts";
import type { CallHandler, ExecutionContext } from "@nestjs/common";
import { Injectable, NestInterceptor } from "@nestjs/common";
import type { Observable } from "rxjs";
import { tap } from "rxjs/operators";


import { mapContractErrorToHttpStatus } from "./error-to-http-status";

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
        const response = value as ResponseWithOneof<unknown> | undefined;
        if (!response || typeof response !== "object") return;

        if (isErrorResponse(response)) {
          const error = response.result?.error;
          if (error) {
            res.status(mapContractErrorToHttpStatus(error));
          } else {
            res.status(500);
          }
          return;
        }

        if (isSuccessResponse(response)) {
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

