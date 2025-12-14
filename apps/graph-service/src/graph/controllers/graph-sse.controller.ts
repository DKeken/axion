/**
 * Graph SSE Controller
 * Server-Sent Events endpoint for real-time graph updates
 */

import { getUserIdFromSession } from "@axion/better-auth";
import type { RequestMetadata } from "@axion/contracts";
import { createRequestMetadata } from "@axion/shared";
import {
  Controller,
  Query,
  Req,
  Sse,
  MessageEvent,
  Logger,
} from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import type { betterAuth } from "better-auth";
import { Observable } from "rxjs";

import { verifyProjectAccess } from "@/graph/helpers/project-access.helper";
import { type ProjectRepository } from "@/graph/repositories/project.repository";
import { GraphSseService } from "@/graph/services/graph-sse.service";

// Request type from NestJS platform-express
type NestRequest = {
  headers: Record<string, string | string[] | undefined>;
  cookies?: Record<string, string>;
};

@Controller("graph/sse")
export class GraphSseController {
  private readonly logger = new Logger(GraphSseController.name);
  private auth: ReturnType<typeof betterAuth> | null = null;
  private authResolved = false;

  constructor(
    private readonly sseService: GraphSseService,
    private readonly projectRepository: ProjectRepository,
    private readonly moduleRef: ModuleRef
  ) {}

  /**
   * Subscribe to Server-Sent Events for a specific project
   * GET /graph/sse/events?projectId=xxx
   *
   * Authentication via:
   * - Authorization header: Bearer <session_token>
   * - Cookie: better-auth.session_token=<session_token>
   * - Query param: userId=<user_id> (for development/testing only)
   */
  @Sse("events")
  async subscribe(
    @Query("projectId") projectId: string,
    @Query("userId") userId?: string,
    @Req() req?: NestRequest
  ): Promise<Observable<MessageEvent>> {
    if (!projectId) {
      this.logger.warn("SSE subscription attempt without projectId");
      return new Observable((subscriber) => {
        subscriber.complete();
      });
    }

    try {
      // Lazily resolve BETTER_AUTH provider on first use
      if (!this.authResolved) {
        try {
          this.auth = this.moduleRef.get("BETTER_AUTH", { strict: false });
          this.authResolved = true;
          if (!this.auth) {
            this.logger.debug(
              "GraphSseController: BETTER_AUTH not available - session validation disabled"
            );
          }
        } catch {
          this.logger.debug(
            "GraphSseController: Failed to resolve BETTER_AUTH - session validation disabled"
          );
          this.authResolved = true;
        }
      }

      // Extract user ID from various sources
      // Priority: Better Auth session > Query param (dev only)
      let extractedUserId: string | undefined;

      // Try Better Auth session validation
      if (req && this.auth) {
        try {
          // Convert headers to string format expected by better-auth
          const headers: Record<string, string> = {};
          for (const [key, value] of Object.entries(req.headers)) {
            if (value) {
              headers[key] = Array.isArray(value) ? value[0] : value;
            }
          }
          const session = await this.auth.api.getSession({ headers });

          if (session) {
            extractedUserId = getUserIdFromSession(session);
          }
        } catch (error) {
          this.logger.debug(
            `Failed to validate session for SSE: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }

      // Try query param (for development/testing only)
      if (!extractedUserId && userId) {
        this.logger.warn(
          "Using userId from query param (development mode only)"
        );
        extractedUserId = userId;
      }

      if (!extractedUserId) {
        this.logger.warn(
          `SSE subscription attempt without authentication for project ${projectId}`
        );
        return new Observable((subscriber) => {
          subscriber.complete();
        });
      }

      // Verify project access
      const metadata: RequestMetadata = createRequestMetadata(extractedUserId);
      const access = await verifyProjectAccess(
        this.projectRepository,
        projectId,
        metadata
      );

      if (!access.success) {
        const errorMessage =
          access.response.result?.error?.message || "Access denied";
        this.logger.warn(
          `SSE subscription denied for project ${projectId}: ${errorMessage}`
        );
        return new Observable((subscriber) => {
          subscriber.complete();
        });
      }

      this.logger.log(
        `SSE subscription established for project: ${projectId}, user: ${extractedUserId}`
      );

      const stream = this.sseService.subscribe(projectId);

      return stream;
    } catch (error) {
      this.logger.error(
        `Error establishing SSE connection for project ${projectId}:`,
        error
      );
      return new Observable((subscriber) => {
        subscriber.complete();
      });
    }
  }
}
