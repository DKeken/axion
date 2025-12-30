/**
 * Kafka Retry Policy
 * Implements retry strategies for Kafka message processing
 */

export type RetryPolicy = {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  multiplier: number;
  retryableErrors: string[]; // Error codes that should be retried
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  multiplier: 2,
  retryableErrors: ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "TEMPORARY_ERROR"],
};

/**
 * Check if error should be retried
 */
export function shouldRetry(
  error: Error,
  attempt: number,
  policy: RetryPolicy = DEFAULT_RETRY_POLICY
): boolean {
  if (attempt >= policy.maxAttempts) {
    return false;
  }

  // Check if error is retryable
  const isRetryableError = policy.retryableErrors.some((code) =>
    error.message.includes(code)
  );

  if (!isRetryableError) {
    return false;
  }

  return true;
}

/**
 * Get retry delay with exponential backoff and jitter
 */
export function getRetryDelay(
  attempt: number,
  policy: RetryPolicy = DEFAULT_RETRY_POLICY
): number {
  const delay = Math.min(
    policy.initialDelayMs * Math.pow(policy.multiplier, attempt),
    policy.maxDelayMs
  );

  // Add jitter to avoid thundering herd
  const jitter = Math.random() * 0.3 * delay;
  return Math.floor(delay + jitter);
}
