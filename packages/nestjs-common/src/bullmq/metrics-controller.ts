/**
 * BullMQ Metrics Controller
 * Provides HTTP endpoints for queue metrics (read-only, for observability)
 */

import { Controller, Get, Param, Logger } from "@nestjs/common";
import { Queue } from "bullmq";

import { getQueueMetricsSummary, type QueueMetricsSummary } from "./metrics";

/**
 * BullMQ Metrics Controller
 * Exposes read-only metrics endpoints for queue observability
 */
@Controller("metrics/bullmq")
export class BullMQMetricsController {
  private readonly logger = new Logger(BullMQMetricsController.name);

  constructor() // Note: NestJS doesn't support multiple @InjectQueue() decorators
  // In practice, you'd inject specific queues or use a factory
  // This is a placeholder showing the pattern
  {
    // Queue injection would be implemented here
  }

  /**
   * Get metrics for a specific queue
   * GET /metrics/bullmq/:queueName
   */
  @Get(":queueName")
  async getQueueMetrics(
    @Param("queueName") queueName: string
  ): Promise<QueueMetricsSummary> {
    // Find queue by name
    // Note: In practice, you'd maintain a registry of queues
    // For now, this is a placeholder showing the pattern

    this.logger.log(`Getting metrics for queue: ${queueName}`);

    // This would need to be implemented with a queue registry
    throw new Error(
      "Queue registry not implemented. Inject queues explicitly or use a factory."
    );
  }

  /**
   * Get metrics for all queues
   * GET /metrics/bullmq
   */
  @Get()
  async getAllQueueMetrics(): Promise<Record<string, QueueMetricsSummary>> {
    this.logger.log("Getting metrics for all queues");

    // This would iterate over all registered queues
    // For now, this is a placeholder
    return {};
  }
}

/**
 * Helper function to create metrics controller with queue registry
 * Usage:
 * ```typescript
 * const metricsController = createMetricsController({
 *   [QUEUE_NAMES.DEPLOYMENT]: deploymentQueue,
 *   [QUEUE_NAMES.AGENT_INSTALLATION]: agentInstallationQueue,
 * });
 * ```
 */
export function createMetricsController(queues: Record<string, Queue>) {
  // This would create a controller instance with access to all queues
  // Implementation depends on your NestJS setup
  // For now, this is a placeholder showing the pattern
  return {
    async getMetrics(queueName: string) {
      const queue = queues[queueName];
      if (!queue) {
        throw new Error(`Queue not found: ${queueName}`);
      }
      return getQueueMetricsSummary(queue);
    },
    async getAllMetrics() {
      const results: Record<string, QueueMetricsSummary> = {};
      for (const [name, queue] of Object.entries(queues)) {
        results[name] = await getQueueMetricsSummary(queue);
      }
      return results;
    },
  };
}
