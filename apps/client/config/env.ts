export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
  authUrl: process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:8080/api/auth",
  aiModel: process.env.NEXT_PUBLIC_AI_MODEL || "openai/gpt-4o-mini",
} as const;
