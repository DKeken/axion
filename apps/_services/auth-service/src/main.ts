import {
  type ValidateSessionHttpInput,
  normalizeValidateSessionInput,
  createSessionValidationSuccess,
  createSessionValidationError,
} from "@axion/contracts";
import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";

import { auth } from "@/auth/auth";
import { env } from "@/config/env";
import {
  getConsumer,
  disconnectKafka,
  getProducer,
} from "@/kafka/kafka-client";
import { startSessionValidator } from "@/kafka/session-validator";

const app = new Elysia()
  .use(
    cors({
      origin: env.trustedOrigins,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  )
  .get("/health", () => ({ status: "ok" }))
  .post("/api/auth/validate-session", async ({ request }) => {
    try {
      const body = (await request.json()) as ValidateSessionHttpInput;

      // Normalize to Protobuf contract format
      const normalized = normalizeValidateSessionInput(body);
      const sessionToken = normalized.sessionToken;

      if (!sessionToken || typeof sessionToken !== "string") {
        return createSessionValidationError(
          "MISSING_TOKEN",
          "Session token is required"
        );
      }

      // Use Better Auth API to validate session
      const session = await auth.api.getSession({
        headers: {
          authorization: `Bearer ${sessionToken}`,
        },
      });

      if (!session || !session.user) {
        return createSessionValidationError(
          "INVALID_SESSION",
          "Session not found or expired"
        );
      }

      // Map Better Auth session to our Protobuf format
      return createSessionValidationSuccess(
        {
          id: session.session.id,
          userId: session.user.id,
          token: "",
          expiresAt: new Date(session.session.expiresAt),
          createdAt: new Date(session.session.createdAt),
          metadata: {
          ipAddress: session.session.ipAddress || "",
          userAgent: session.session.userAgent || "",
          },
        },
        {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
          createdAt: new Date(session.user.createdAt),
          updatedAt: new Date(session.user.updatedAt),
        }
      );
    } catch (error) {
      console.error("[auth-service] Error validating session:", error);
      return createSessionValidationError(
        "VALIDATION_ERROR",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  })
  .all("/api/auth/*", async ({ request }) => auth.handler(request));

app.listen(env.port);

console.warn(
  `[auth-service] HTTP server listening on http://localhost:${env.port}`
);

// Start Kafka consumer for session validation (if configured)
if (env.kafkaBrokers) {
  console.warn(`[auth-service] Starting Kafka consumer...`);
  getConsumer("axion-auth-service-group")
    .then(async (consumer) => {
      const producer = await getProducer();
      await startSessionValidator(consumer, producer);
      console.warn("[auth-service] Kafka consumer started successfully");
    })
    .catch((error) => {
      console.error("[auth-service] Failed to start Kafka consumer:", error);
      console.warn(
        "[auth-service] Continuing without Kafka - HTTP endpoints will still work"
      );
    });
} else {
  console.warn(
    "[auth-service] Kafka brokers not configured - running in HTTP-only mode"
  );
}

// Graceful shutdown
const shutdown = async () => {
  console.warn("\n[auth-service] Shutting down gracefully...");

  try {
    await disconnectKafka();
    console.warn("[auth-service] Kafka disconnected");
  } catch (error) {
    console.error("[auth-service] Error disconnecting Kafka:", error);
  }

  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
