import { Kafka, type Consumer, type Producer } from "kafkajs";

import { env } from "@/config/env";

/**
 * KafkaJS client for auth-service
 * Provides producer and consumer for Kafka communication
 */

let kafka: Kafka | null = null;
let producer: Producer | null = null;
let consumer: Consumer | null = null;

export function createKafkaClient(): Kafka {
  if (kafka) return kafka;

  const brokers = env.kafkaBrokers || "localhost:9092";
  const brokerList = brokers.split(",");

  kafka = new Kafka({
    clientId: "axion-auth-service",
    brokers: brokerList,
    connectionTimeout: 10000,
    requestTimeout: 30000,
    retry: {
      retries: Infinity,
      initialRetryTime: 100,
      maxRetryTime: 30000,
      multiplier: 2,
    },
  });

  console.log(
    `[auth-service][kafka] Kafka client created for brokers: ${brokerList.join(", ")}`
  );
  return kafka;
}

export async function getProducer(): Promise<Producer> {
  if (producer) return producer;

  const kafkaClient = createKafkaClient();
  producer = kafkaClient.producer({
    transactionTimeout: 30000,
    maxInFlightRequests: 5,
    idempotent: true,
    retry: {
      retries: Infinity,
      initialRetryTime: 100,
      maxRetryTime: 30000,
      multiplier: 2,
    },
  });

  await producer.connect();
  console.log("[auth-service][kafka] Producer connected");
  return producer;
}

export async function getConsumer(groupId: string): Promise<Consumer> {
  if (consumer) return consumer;

  const kafkaClient = createKafkaClient();
  consumer = kafkaClient.consumer({
    groupId,
    sessionTimeout: 10000,
    heartbeatInterval: 3000,
    rebalanceTimeout: 30000,
    maxWaitTimeInMs: 5000,
    retry: {
      retries: 8,
      initialRetryTime: 100,
      maxRetryTime: 10000,
      multiplier: 2,
    },
    readUncommitted: false,
  });

  await consumer.connect();
  console.log(`[auth-service][kafka] Consumer connected (group: ${groupId})`);
  return consumer;
}

export async function disconnectKafka(): Promise<void> {
  const promises: Promise<void>[] = [];

  if (producer) {
    promises.push(producer.disconnect());
    console.log("[auth-service][kafka] Disconnecting producer...");
  }

  if (consumer) {
    promises.push(consumer.disconnect());
    console.log("[auth-service][kafka] Disconnecting consumer...");
  }

  await Promise.all(promises);
  console.log("[auth-service][kafka] All Kafka connections closed");

  producer = null;
  consumer = null;
  kafka = null;
}
