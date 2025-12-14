import { Transport, type KafkaOptions } from "@nestjs/microservices";
import {
  type KafkaConfig,
  type SASLOptions,
  type SASLMechanism,
} from "kafkajs";

/**
 * Kafka helper functions for NestJS Microservices
 */

/**
 * Kafka authentication configuration
 * Uses types from kafkajs library
 */
export interface KafkaAuthConfig {
  mechanism?: SASLMechanism;
  username?: string;
  password?: string;
}

/**
 * Create Kafka server options for NestJS Microservices
 * Supports optional SASL authentication via environment variables
 */
export function createKafkaServerOptions(
  serviceName: string,
  brokers: string | string[],
  authConfig?: KafkaAuthConfig
): KafkaOptions {
  const normalizedName = serviceName.toLowerCase().replace(/_/g, "-");
  const brokerList = Array.isArray(brokers) ? brokers : brokers.split(",");

  // Get auth config from parameters or environment variables
  const auth =
    authConfig ||
    (process.env.KAFKA_SASL_USERNAME && process.env.KAFKA_SASL_PASSWORD
      ? {
          mechanism:
            (process.env.KAFKA_SASL_MECHANISM as SASLMechanism) ||
            ("scram-sha-512" as SASLMechanism),
          username: process.env.KAFKA_SASL_USERNAME,
          password: process.env.KAFKA_SASL_PASSWORD,
        }
      : undefined);

  // Build SASL options if authentication is configured
  let sasl: SASLOptions | undefined;
  if (auth && auth.username && auth.password) {
    const mechanism = auth.mechanism || ("scram-sha-512" as SASLMechanism);
    if (mechanism === "plain") {
      sasl = {
        mechanism: "plain",
        username: auth.username,
        password: auth.password,
      };
    } else if (mechanism === "scram-sha-256") {
      sasl = {
        mechanism: "scram-sha-256",
        username: auth.username,
        password: auth.password,
      };
    } else {
      sasl = {
        mechanism: "scram-sha-512",
        username: auth.username,
        password: auth.password,
      };
    }
  }

  const clientConfig: KafkaConfig = {
    clientId: `axion-${normalizedName}-server`,
    brokers: brokerList,
    // Connection timeout settings - increased for initial connection
    connectionTimeout: 10000, // 10 seconds for initial connection
    requestTimeout: 30000,
    // Retry configuration - unlimited retries for idempotent producer to maintain EoS guarantees
    retry: {
      retries: Infinity, // Unlimited retries for idempotent producer (required for EoS)
      initialRetryTime: 100,
      maxRetryTime: 30000,
      multiplier: 2,
    },
    // Add SASL authentication if configured
    ...(sasl && { sasl }),
  };

  return {
    transport: Transport.KAFKA,
    options: {
      client: clientConfig,
      consumer: {
        groupId: `axion-${normalizedName}-group`,
        allowAutoTopicCreation: true,
        // Session and heartbeat configuration to prevent rebalancing errors
        // Must match Kafka broker settings: min=3000ms, max=10000ms (from docker-compose.yml)
        // sessionTimeout: Maximum time a consumer can go without sending a heartbeat
        // heartbeatInterval: How often to send heartbeats (must be < sessionTimeout / 3)
        // rebalanceTimeout: Max time to wait for all members during rebalance
        sessionTimeout: 10000, // 10s - matches KAFKA_GROUP_MAX_SESSION_TIMEOUT_MS
        heartbeatInterval: 3000, // 3s (must be < sessionTimeout / 3 = 3.33s)
        // Rebalance timeout for group coordination
        // Should be higher than sessionTimeout to allow time for all consumers to join
        rebalanceTimeout: 30000, // 30s - should be > sessionTimeout
        // Max wait time for fetch requests - MUST be less than sessionTimeout
        // to prevent consumer being kicked out during long polls
        maxWaitTimeInMs: 5000, // 5s max wait (safely below sessionTimeout)
        // Retry configuration for consumer
        retry: {
          retries: 8,
          initialRetryTime: 100,
          maxRetryTime: 10000,
          multiplier: 2,
        },
        // Batch settings for better performance
        minBytes: 1, // Don't wait for minimum bytes
        maxBytes: 10485760, // 10MB max batch size
        // Read committed messages only (for EoS)
        readUncommitted: false,
      },
      producer: {
        // Use default partitioner (KafkaJS v2.0.0 default)
        // No createPartitioner specified - uses default Murmur2 partitioner
        // Producer timeout settings
        transactionTimeout: 30000,
        maxInFlightRequests: 5, // Increased for better performance with idempotent producer
        idempotent: true,
        // Retry configuration for producer (inherits from client config)
        retry: {
          retries: Infinity, // Unlimited retries for EoS guarantees
          initialRetryTime: 100,
          maxRetryTime: 30000,
          multiplier: 2,
        },
      },
      // Subscribe options for automatic topic creation
      subscribe: {
        fromBeginning: false,
      },
    },
  };
}

/**
 * Create Kafka client options for NestJS Microservices
 * Supports optional SASL authentication via environment variables
 */
export function createKafkaClientOptions(
  serviceName: string,
  brokers: string | string[],
  authConfig?: KafkaAuthConfig
): { name: string } & KafkaOptions {
  const normalizedName = serviceName.toLowerCase().replace(/_/g, "-");
  const brokerList = Array.isArray(brokers) ? brokers : brokers.split(",");

  // Get auth config from parameters or environment variables
  const auth =
    authConfig ||
    (process.env.KAFKA_SASL_USERNAME && process.env.KAFKA_SASL_PASSWORD
      ? {
          mechanism:
            (process.env.KAFKA_SASL_MECHANISM as SASLMechanism) ||
            ("scram-sha-512" as SASLMechanism),
          username: process.env.KAFKA_SASL_USERNAME,
          password: process.env.KAFKA_SASL_PASSWORD,
        }
      : undefined);

  // Build SASL options if authentication is configured
  let sasl: SASLOptions | undefined;
  if (auth && auth.username && auth.password) {
    const mechanism = auth.mechanism || ("scram-sha-512" as SASLMechanism);
    if (mechanism === "plain") {
      sasl = {
        mechanism: "plain",
        username: auth.username,
        password: auth.password,
      };
    } else if (mechanism === "scram-sha-256") {
      sasl = {
        mechanism: "scram-sha-256",
        username: auth.username,
        password: auth.password,
      };
    } else {
      sasl = {
        mechanism: "scram-sha-512",
        username: auth.username,
        password: auth.password,
      };
    }
  }

  const clientConfig: KafkaConfig = {
    clientId: `axion-${normalizedName}-client`,
    brokers: brokerList,
    // Connection timeout settings - increased for initial connection
    connectionTimeout: 10000, // 10 seconds for initial connection
    requestTimeout: 30000,
    // Retry configuration - unlimited retries for idempotent producer to maintain EoS guarantees
    retry: {
      retries: Infinity, // Unlimited retries for idempotent producer (required for EoS)
      initialRetryTime: 100,
      maxRetryTime: 30000,
      multiplier: 2,
    },
    // Add SASL authentication if configured
    ...(sasl && { sasl }),
  };

  return {
    name: serviceName,
    transport: Transport.KAFKA,
    options: {
      client: clientConfig,
      consumer: {
        groupId: `axion-${normalizedName}-client-group`,
        allowAutoTopicCreation: true,
        // Session and heartbeat configuration to prevent rebalancing errors
        // Must match Kafka broker settings: min=3000ms, max=10000ms (from docker-compose.yml)
        // sessionTimeout: Maximum time a consumer can go without sending a heartbeat
        // heartbeatInterval: How often to send heartbeats (must be < sessionTimeout / 3)
        // rebalanceTimeout: Max time to wait for all members during rebalance
        sessionTimeout: 10000, // 10s - matches KAFKA_GROUP_MAX_SESSION_TIMEOUT_MS
        heartbeatInterval: 3000, // 3s (must be < sessionTimeout / 3 = 3.33s)
        // Rebalance timeout for group coordination
        // Should be higher than sessionTimeout to allow time for all consumers to join
        rebalanceTimeout: 30000, // 30s - should be > sessionTimeout
        // Max wait time for fetch requests - MUST be less than sessionTimeout
        // to prevent consumer being kicked out during long polls
        maxWaitTimeInMs: 5000, // 5s max wait (safely below sessionTimeout)
        // Retry configuration for consumer
        retry: {
          retries: 8,
          initialRetryTime: 100,
          maxRetryTime: 10000,
          multiplier: 2,
        },
        // Batch settings for better performance
        minBytes: 1, // Don't wait for minimum bytes
        maxBytes: 10485760, // 10MB max batch size
        // Read committed messages only (for EoS)
        readUncommitted: false,
      },
      producer: {
        // Use default partitioner (KafkaJS v2.0.0 default)
        // No createPartitioner specified - uses default Murmur2 partitioner
        // Producer timeout settings
        transactionTimeout: 30000,
        maxInFlightRequests: 5, // Increased for better performance with idempotent producer
        idempotent: true,
        // Retry configuration for producer (inherits from client config)
        retry: {
          retries: Infinity, // Unlimited retries for EoS guarantees
          initialRetryTime: 100,
          maxRetryTime: 30000,
          multiplier: 2,
        },
      },
      // Subscribe options for automatic topic creation
      subscribe: {
        fromBeginning: false,
      },
    },
  };
}
