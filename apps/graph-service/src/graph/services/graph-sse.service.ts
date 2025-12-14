/**
 * Graph SSE Service
 * Manages Server-Sent Events streams for graph updates
 */

import type { MessageEvent } from "@nestjs/common";
import { Injectable, Logger } from "@nestjs/common";
import { Subject, Observable } from "rxjs";

import type { ProjectEvent } from "@/graph/types/sse-events";

@Injectable()
export class GraphSseService {
  private readonly logger = new Logger(GraphSseService.name);
  // Map of projectId -> Subject for broadcasting events
  private readonly projectStreams = new Map<string, Subject<MessageEvent>>();
  // Map of projectId -> connection count
  private readonly connectionCounts = new Map<string, number>();

  /**
   * Subscribe to events for a specific project
   * Returns an Observable that emits events for the project
   */
  subscribe(projectId: string): Observable<MessageEvent> {
    this.logger.debug(`New SSE subscription for project: ${projectId}`);

    // Get or create Subject for this project
    let subject = this.projectStreams.get(projectId);
    if (!subject) {
      subject = new Subject<MessageEvent>();
      this.projectStreams.set(projectId, subject);
      this.connectionCounts.set(projectId, 0);
    }

    // Increment connection count
    const currentCount = this.connectionCounts.get(projectId) || 0;
    this.connectionCounts.set(projectId, currentCount + 1);

    this.logger.debug(
      `SSE connections for project ${projectId}: ${currentCount + 1}`
    );

    return subject.asObservable();
  }

  /**
   * Unsubscribe from events for a specific project
   */
  unsubscribe(projectId: string): void {
    const currentCount = this.connectionCounts.get(projectId) || 0;
    if (currentCount > 1) {
      this.connectionCounts.set(projectId, currentCount - 1);
      this.logger.debug(
        `SSE connections for project ${projectId}: ${currentCount - 1}`
      );
    } else {
      // Last connection, clean up
      const subject = this.projectStreams.get(projectId);
      if (subject) {
        subject.complete();
        this.projectStreams.delete(projectId);
        this.connectionCounts.delete(projectId);
        this.logger.debug(`Cleaned up SSE stream for project: ${projectId}`);
      }
    }
  }

  /**
   * Broadcast an event to all subscribers of a project
   */
  broadcast(projectId: string, event: ProjectEvent): void {
    const subject = this.projectStreams.get(projectId);
    if (!subject) {
      this.logger.debug(
        `No active SSE connections for project: ${projectId}, skipping broadcast`
      );
      return;
    }

    const messageEvent: MessageEvent = {
      type: event.type,
      id: `${event.type}-${Date.now()}`,
      data: {
        event: event.type,
        projectId: event.projectId,
        data: event.data,
        timestamp: event.timestamp,
      },
    };

    subject.next(messageEvent);
    this.logger.debug(
      `Broadcasted ${event.type} event to project ${projectId} SSE subscribers`
    );
  }

  /**
   * Get active connection count for a project
   */
  getConnectionCount(projectId: string): number {
    return this.connectionCounts.get(projectId) || 0;
  }

  /**
   * Get total active connections across all projects
   */
  getTotalConnections(): number {
    return Array.from(this.connectionCounts.values()).reduce(
      (sum, count) => sum + count,
      0
    );
  }
}
