import {
  AUTH_SERVICE_PATTERNS,
  Status,
  type ValidateSessionRequest,
  type ValidateSessionResponse,
} from "@axion/contracts";
import type { Consumer, EachMessagePayload, Producer } from "kafkajs";

import { auth } from "@/auth/auth";

/**
 * Kafka consumer для валидации сессий
 * Слушает topic AUTH_SERVICE_PATTERNS.VALIDATE_SESSION и возвращает валидированную сессию
 */

export async function startSessionValidator(
  consumer: Consumer,
  producer: Producer
): Promise<void> {
  const topic = AUTH_SERVICE_PATTERNS.VALIDATE_SESSION;

  await consumer.subscribe({ topic, fromBeginning: false });
  console.warn(
    `[auth-service][session-validator] Subscribed to topic: ${topic}`
  );

  await consumer.run({
    eachMessage: async (payload: EachMessagePayload) => {
      try {
        await handleValidateSessionMessage(payload, producer);
      } catch (error) {
        console.error(
          "[auth-service][session-validator] Error processing message:",
          error
        );
      }
    },
  });

  console.warn("[auth-service][session-validator] Session validator started");
}

async function handleValidateSessionMessage(
  payload: EachMessagePayload,
  producer: Producer
): Promise<void> {
  const { topic, partition, message } = payload;

  if (!message.value) {
    console.warn(
      "[auth-service][session-validator] Received message without value"
    );
    return;
  }

  try {
    // Parse request
    const request = JSON.parse(
      message.value.toString()
    ) as ValidateSessionRequest;

    console.warn(
      `[auth-service][session-validator] Validating session from ${topic}:${partition}`,
      { 
        headerKeys: Object.keys(message.headers || {}),
        headers: message.headers 
      }
    );

    const response = await validateSession(request);

    // NestJS Kafka protocol:
    // Support both default NestJS headers and kafka-prefixed headers (some versions/drivers)
    const correlationId = (
      message.headers?.["__nest-correlation-id"] || 
      message.headers?.["kafka_correlationId"] ||
      message.headers?.["kafka_correlationid"] // case insensitive check
    )?.toString();
    
    const replyTopic = (
      message.headers?.["__nest-reply-topic"] || 
      message.headers?.["kafka_replyTopic"]
    )?.toString() || `${topic}.reply`;

    if (correlationId) {
      // Send response back via producer
      await producer.send({
        topic: replyTopic,
        messages: [
          {
            key: correlationId,
            value: JSON.stringify(response),
            headers: {
              "__nest-correlation-id": correlationId,
              "kafka_correlationId": correlationId, // Send both just in case
            },
          },
        ],
      });

      console.warn(
        `[auth-service][session-validator] Sent reply to ${replyTopic}`,
        {
          correlationId,
          status: response.status,
          userId: response.session?.userId,
        }
      );
    } else {
      console.warn(
        "[auth-service][session-validator] No correlation ID in message headers - cannot send response",
        { headers: message.headers }
      );
    }
  } catch (error) {
    console.error(
      "[auth-service][session-validator] Error parsing or validating:",
      error
    );
  }
}

/**
 * Validates a session token using Better Auth
 */
async function validateSession(
  request: ValidateSessionRequest
): Promise<ValidateSessionResponse> {
  console.warn("[auth-service][session-validator] Validating token:", {
    token: request.sessionToken?.substring(0, 10) + "...",
  });
  try {
    if (!request.sessionToken) {
      return {
        status: Status.STATUS_ERROR,
        error: {
          code: "MISSING_TOKEN",
          message: "Session token is required",
          details: {},
        },
      };
    }

    // Use Better Auth API to validate the session
    console.warn("[auth-service][session-validator] Calling better-auth getSession...");
    
    // Add a race to prevent hanging
    const session = await Promise.race([
      auth.api.getSession({
        headers: {
          authorization: `Bearer ${request.sessionToken}`,
        },
      }),
      new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error("better-auth getSession timeout")), 5000)
      )
    ]);
    
    console.warn("[auth-service][session-validator] getSession result:", {
      success: !!session,
      userId: session?.user?.id,
    });

    if (!session || !session.user) {
      return {
        status: Status.STATUS_ERROR,
        error: {
          code: "INVALID_SESSION",
          message: "Session not found or expired",
          details: {},
        },
      };
    }

    // Map Better Auth session to our Protobuf format
    return {
      status: Status.STATUS_SUCCESS,
      session: {
        userId: session.user.id,
        sessionId: session.session.id,
        expiresAt: new Date(session.session.expiresAt).getTime(),
        ipAddress: session.session.ipAddress || "",
        userAgent: session.session.userAgent || "",
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          emailVerified: session.user.emailVerified,
          image: session.user.image || "",
        },
      },
    };
  } catch (error) {
    console.error(
      "[auth-service][session-validator] Error validating session:",
      error
    );
    return {
      status: Status.STATUS_ERROR,
      error: {
        code: "VALIDATION_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
        details: {},
      },
    };
  }
}
