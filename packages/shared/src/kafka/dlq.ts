/**
 * Dead Letter Queue (DLQ) utilities for Kafka
 * Provides standardized DLQ event envelope and routing
 */

/**
 * DLQ Event Envelope
 * Standard format for messages sent to Dead Letter Queue
 */
export interface DLQEventEnvelope {
  /**
   * Original topic where the message was consumed from
   */
  originalTopic: string;

  /**
   * Original message key (if any)
   */
  originalKey?: string;

  /**
   * Original message headers
   */
  originalHeaders: Record<string, string | string[] | undefined>;

  /**
   * Original message payload
   */
  originalPayload: unknown;

  /**
   * Number of retry attempts before sending to DLQ
   */
  attempt: number;

  /**
   * Error that caused the message to be sent to DLQ
   */
  error: {
    message: string;
    stack?: string;
    code?: string;
    name?: string;
  };

  /**
   * Timestamp when message was sent to DLQ
   */
  dlqTimestamp: number;

  /**
   * Service name that failed to process the message
   */
  serviceName: string;

  /**
   * MessagePattern that failed
   */
  messagePattern?: string;

  /**
   * Correlation ID from original message (for tracing)
   */
  correlationId?: string;
}

/**
 * Create DLQ event envelope from failed message
 */
export function createDLQEventEnvelope(
  originalTopic: string,
  originalKey: string | undefined,
  originalHeaders: Record<string, string | string[] | undefined>,
  originalPayload: unknown,
  error: Error | unknown,
  attempt: number,
  serviceName: string,
  messagePattern?: string
): DLQEventEnvelope {
  const errorObj =
    error instanceof Error
      ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        }
      : {
          message: String(error),
        };

  // Extract correlationId from headers
  const correlationId =
    originalHeaders["x-correlation-id"] ||
    originalHeaders["correlation-id"] ||
    (Array.isArray(originalHeaders["x-correlation-id"])
      ? originalHeaders["x-correlation-id"][0]
      : undefined);

  return {
    originalTopic,
    originalKey,
    originalHeaders,
    originalPayload,
    attempt,
    error: errorObj,
    dlqTimestamp: Date.now(),
    serviceName,
    messagePattern,
    correlationId:
      typeof correlationId === "string" ? correlationId : undefined,
  };
}

/**
 * DLQ Topic naming convention
 * Format: {service-name}-dlq or axion-dlq (common DLQ)
 */
export function getDLQTopicName(
  serviceName: string,
  useCommonDLQ: boolean = false
): string {
  if (useCommonDLQ) {
    return "axion-dlq";
  }
  const normalizedName = serviceName.toLowerCase().replace(/_/g, "-");
  return `${normalizedName}-dlq`;
}

/**
 * Extract service name from DLQ topic
 */
export function getServiceNameFromDLQTopic(dlqTopic: string): string {
  if (dlqTopic === "axion-dlq") {
    return "common";
  }
  return dlqTopic.replace(/-dlq$/, "");
}

/**
 * Check if message should be retried or sent to DLQ
 */
export function shouldSendToDLQ(
  attempt: number,
  maxRetries: number = 3
): boolean {
  return attempt > maxRetries;
}

/**
 * DLQ Replay Options
 */
export interface DLQReplayOptions {
  /**
   * Target topic to replay message to (default: originalTopic)
   */
  targetTopic?: string;

  /**
   * New correlationId (if regenerating)
   */
  newCorrelationId?: string;

  /**
   * Whether to reset attempt counter
   */
  resetAttempt?: boolean;

  /**
   * Additional headers to add
   */
  additionalHeaders?: Record<string, string>;
}

/**
 * Prepare message for replay from DLQ
 */
export function prepareDLQReplay(
  envelope: DLQEventEnvelope,
  options: DLQReplayOptions = {}
): {
  topic: string;
  key: string | undefined;
  payload: unknown;
  headers: Record<string, string>;
} {
  const topic = options.targetTopic || envelope.originalTopic;
  const headers: Record<string, string> = {};

  // Copy original headers (convert arrays to strings)
  for (const [key, value] of Object.entries(envelope.originalHeaders)) {
    if (value !== undefined) {
      headers[key] = Array.isArray(value) ? value[0] : value;
    }
  }

  // Add replay marker
  headers["x-dlq-replay"] = "true";
  headers["x-dlq-original-topic"] = envelope.originalTopic;
  headers["x-dlq-original-attempt"] = String(envelope.attempt);

  // Update correlationId if provided
  if (options.newCorrelationId) {
    headers["x-correlation-id"] = options.newCorrelationId;
    headers["x-causation-id"] = envelope.correlationId || "";
  } else if (envelope.correlationId) {
    headers["x-correlation-id"] = envelope.correlationId;
  }

  // Reset attempt if requested
  if (options.resetAttempt) {
    headers["x-attempt"] = "0";
  } else {
    headers["x-attempt"] = String(envelope.attempt);
  }

  // Add additional headers
  if (options.additionalHeaders) {
    Object.assign(headers, options.additionalHeaders);
  }

  return {
    topic,
    key: envelope.originalKey,
    payload: envelope.originalPayload,
    headers,
  };
}

/**
 * Check if message is a DLQ replay (to prevent infinite loops)
 */
export function isDLQReplay(
  headers: Record<string, string | string[] | undefined>
): boolean {
  const replayMarker =
    headers["x-dlq-replay"] || headers["dlq-replay"] || headers["X-DLQ-Replay"];

  if (!replayMarker) {
    return false;
  }

  const value = Array.isArray(replayMarker) ? replayMarker[0] : replayMarker;
  return value === "true";
}
