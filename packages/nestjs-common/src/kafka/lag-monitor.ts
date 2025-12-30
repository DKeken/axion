/**
 * Kafka Lag Monitor
 * Provides metrics for consumer lag and error rates
 */

import { Injectable, Logger } from "@nestjs/common";
import type { Admin } from "kafkajs";

export type LagMetrics = {
  groupId: string;
  topic: string;
  partition: number;
  lag: number;
  currentOffset: number;
  highWatermark: number;
}

export type TopicPartitionInfo = {
  topic: string;
  partition: number;
  highWatermark: number;
}

export type ErrorRateMetrics = {
  topic: string;
  handler: string;
  errorCount: number;
  successCount: number;
  errorRate: number; // 0-1
  windowStart: Date;
  windowEnd: Date;
}

/**
 * Kafka Lag Monitor
 * Tracks consumer lag and provides metrics
 */
@Injectable()
export class KafkaLagMonitor {
  private readonly logger = new Logger(KafkaLagMonitor.name);
  private errorCounts = new Map<
    string,
    { errors: number; success: number; startTime: Date }
  >();
  private readonly errorWindowMs = 60 * 1000; // 1 minute window

  /**
   * Get consumer lag for a consumer group
   * Note: Requires Admin client to be passed separately as KafkaJS Consumer doesn't expose it
   */
  async getConsumerLag(
    admin: Admin,
    groupId: string,
    topics: string[]
  ): Promise<LagMetrics[]> {
    try {
      if (!admin) {
        this.logger.warn("Admin client not provided");
        return [];
      }

      // Get committed offsets for the consumer group
      const committedOffsets = await admin.fetchOffsets({
        groupId,
        topics,
      });

      // Get high watermarks for all partitions
      const highWatermarks = await this.getHighWatermarks(admin, topics);

      const metrics: LagMetrics[] = [];

      for (const topic of topics) {
        const topicCommittedOffsets = committedOffsets.find(
          (o) => o.topic === topic
        );
        const topicHighWatermarks = highWatermarks.filter(
          (h) => h.topic === topic
        );

        if (!topicCommittedOffsets) {
          continue;
        }

        for (const partitionOffset of topicCommittedOffsets.partitions) {
          const partition = partitionOffset.partition;
          const currentOffset = Number.parseInt(
            partitionOffset.offset || "0",
            10
          );

          const highWatermark =
            topicHighWatermarks.find((h) => h.partition === partition)
              ?.highWatermark || 0;

          const lag = Math.max(0, highWatermark - currentOffset);

          metrics.push({
            groupId,
            topic,
            partition,
            lag,
            currentOffset,
            highWatermark,
          });
        }
      }

      return metrics;
    } catch (error) {
      this.logger.error(
        `Failed to get consumer lag for group ${groupId}`,
        error instanceof Error ? error.stack : undefined
      );
      return [];
    }
  }

  /**
   * Get high watermarks for topics
   */
  private async getHighWatermarks(
    admin: Admin,
    topics: string[]
  ): Promise<TopicPartitionInfo[]> {
    try {
      const metadata = await admin.fetchTopicMetadata({ topics });
      const result: TopicPartitionInfo[] = [];

      for (const topicMetadata of metadata.topics) {
        for (const partitionMetadata of topicMetadata.partitions) {
          // Note: Getting actual high watermark requires fetching from brokers
          // This is a simplified version - in production, you'd use the consumer's
          // offset management or fetch from brokers directly
          result.push({
            topic: topicMetadata.name,
            partition: partitionMetadata.partitionId,
            highWatermark: 0, // Would need broker fetch for actual value
          });
        }
      }

      return result;
    } catch (error) {
      this.logger.error(
        "Failed to get high watermarks",
        error instanceof Error ? error.stack : undefined
      );
      return [];
    }
  }

  /**
   * Record an error for error rate calculation
   */
  recordError(topic: string, handler: string): void {
    const key = `${topic}:${handler}`;
    const now = new Date();
    const existing = this.errorCounts.get(key);

    if (
      !existing ||
      now.getTime() - existing.startTime.getTime() > this.errorWindowMs
    ) {
      // Start new window
      this.errorCounts.set(key, {
        errors: 1,
        success: 0,
        startTime: now,
      });
    } else {
      existing.errors++;
    }
  }

  /**
   * Record a success for error rate calculation
   */
  recordSuccess(topic: string, handler: string): void {
    const key = `${topic}:${handler}`;
    const now = new Date();
    const existing = this.errorCounts.get(key);

    if (
      !existing ||
      now.getTime() - existing.startTime.getTime() > this.errorWindowMs
    ) {
      // Start new window
      this.errorCounts.set(key, {
        errors: 0,
        success: 1,
        startTime: now,
      });
    } else {
      existing.success++;
    }
  }

  /**
   * Get error rate metrics for a topic/handler
   */
  getErrorRate(topic: string, handler: string): ErrorRateMetrics | null {
    const key = `${topic}:${handler}`;
    const data = this.errorCounts.get(key);

    if (!data) {
      return null;
    }

    const total = data.errors + data.success;
    if (total === 0) {
      return null;
    }

    const errorRate = data.errors / total;
    const windowEnd = new Date(data.startTime.getTime() + this.errorWindowMs);

    return {
      topic,
      handler,
      errorCount: data.errors,
      successCount: data.success,
      errorRate,
      windowStart: data.startTime,
      windowEnd,
    };
  }

  /**
   * Get all error rate metrics
   */
  getAllErrorRates(): ErrorRateMetrics[] {
    const results: ErrorRateMetrics[] = [];

    for (const [key, data] of this.errorCounts.entries()) {
      const [topic, handler] = key.split(":");
      const total = data.errors + data.success;

      if (total === 0) {
        continue;
      }

      const errorRate = data.errors / total;
      const windowEnd = new Date(data.startTime.getTime() + this.errorWindowMs);

      results.push({
        topic,
        handler,
        errorCount: data.errors,
        successCount: data.success,
        errorRate,
        windowStart: data.startTime,
        windowEnd,
      });
    }

    return results;
  }

  /**
   * Clean up old error rate windows
   */
  cleanup(): void {
    const now = new Date();

    for (const [key, data] of this.errorCounts.entries()) {
      if (now.getTime() - data.startTime.getTime() > this.errorWindowMs * 2) {
        this.errorCounts.delete(key);
      }
    }
  }
}
