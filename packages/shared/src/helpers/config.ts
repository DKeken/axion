/**
 * Small config parsing helpers.
 *
 * Goal: keep services minimal and consistent without dragging @nestjs/config.
 */

/**
 * Parse a comma-separated list of trusted origins.
 *
 * @example
 * parseTrustedOrigins("https://a.com, https://b.com", ["http://localhost:3000"])
 */
export function parseTrustedOrigins(
  value: string | undefined,
  defaults: string[]
): string[] {
  if (!value) return defaults;

  const origins = value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : defaults;
}

/**
 * Normalize Kafka brokers string.
 *
 * KafkaJS accepts brokers as string[]; our helpers accept string|string[] and
 * split by comma. This helper ensures consistent trimming and fallback.
 *
 * @example
 * parseKafkaBrokers(undefined, "localhost:9092") // "localhost:9092"
 * parseKafkaBrokers("kafka:9092, kafka2:9092", "localhost:9092") // "kafka:9092,kafka2:9092"
 */
export function parseKafkaBrokers(
  value: string | undefined,
  fallback: string
): string {
  if (!value) return fallback;

  const brokers = value
    .split(",")
    .map((broker) => broker.trim())
    .filter(Boolean);

  return brokers.length > 0 ? brokers.join(",") : fallback;
}
