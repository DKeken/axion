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
  console.log(
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

  console.log("[auth-service][session-validator] Session validator started");
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

    console.log(
      `[auth-service][session-validator] Validating session from ${topic}:${partition}`
    );

    const response = await validateSession(request);

    // Extract reply topic from message headers (Kafka Request-Reply pattern)
    const replyTopic = message.headers?.["reply_topic"]?.toString();
    const correlationId = message.headers?.["correlation_id"]?.toString();

    if (replyTopic && correlationId) {
      // Send response back via producer
      await producer.send({
        topic: replyTopic,
        messages: [
          {
            key: correlationId,
            value: JSON.stringify(response),
            headers: {
              correlation_id: correlationId,
            },
          },
        ],
      });

      console.log(
        `[auth-service][session-validator] Sent reply to ${replyTopic}`,
        {
          correlationId,
          status: response.status,
          userId: response.session?.userId,
        }
      );
    } else {
      console.warn(
        "[auth-service][session-validator] No reply_topic or correlation_id in message headers - cannot send response"
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
    const session = await auth.api.getSession({
      headers: {
        authorization: `Bearer ${request.sessionToken}`,
      },
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
