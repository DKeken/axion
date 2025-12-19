/**
 * Kafka headers converter utilities
 * Converts KafkaJS headers (Buffer) to string format
 */

/**
 * Convert KafkaJS headers to string format
 * KafkaJS uses Buffer for header values, we need to convert them to strings
 */
export function convertKafkaHeaders(
  headers: Record<string, string | Buffer | (string | Buffer)[] | undefined>
): Record<string, string | string[] | undefined> {
  const converted: Record<string, string | string[] | undefined> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) {
      converted[key] = undefined;
    } else if (Buffer.isBuffer(value)) {
      converted[key] = value.toString("utf-8");
    } else if (Array.isArray(value)) {
      converted[key] = value.map((v) =>
        Buffer.isBuffer(v) ? v.toString("utf-8") : v
      );
    } else {
      converted[key] = value;
    }
  }

  return converted;
}
