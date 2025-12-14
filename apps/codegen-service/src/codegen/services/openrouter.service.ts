import { Injectable, Logger } from "@nestjs/common";
import { OpenRouter } from "@openrouter/sdk";

/**
 * OpenRouter service for AI code generation
 * Provides a wrapper around the OpenRouter SDK with proper error handling
 */
@Injectable()
export class OpenRouterService {
  private readonly logger = new Logger(OpenRouterService.name);
  private readonly client: OpenRouter;
  private readonly defaultModel: string;

  constructor() {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      this.logger.error(
        "OPENROUTER_API_KEY environment variable is not set. OpenRouter features will not work."
      );
      // Don't throw - let the service start, but log error when used
    }

    this.client = new OpenRouter({
      apiKey: apiKey || "",
    });

    // Default model - можно переопределить через .env
    this.defaultModel =
      process.env.OPENROUTER_DEFAULT_MODEL || "anthropic/claude-3.5-sonnet";

    this.logger.log(`OpenRouter service initialized with model: ${this.defaultModel}`);
  }

  /**
   * Generate text completion using OpenRouter
   * @param prompt - The prompt to send to the AI
   * @param options - Optional parameters (model, temperature, etc.)
   */
  async complete(
    prompt: string,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    }
  ): Promise<string> {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error(
        "OPENROUTER_API_KEY is not configured. Please set it in environment variables."
      );
    }

    try {
      const messages: Array<{ role: "system" | "user"; content: string }> = [];

      if (options?.systemPrompt) {
        messages.push({
          role: "system",
          content: options.systemPrompt,
        });
      }

      messages.push({
        role: "user",
        content: prompt,
      });

      this.logger.log(
        `Sending completion request to model: ${options?.model || this.defaultModel}`
      );

      const completion = await this.client.chat.send({
        model: options?.model || this.defaultModel,
        messages,
        temperature: options?.temperature,
        maxTokens: options?.maxTokens,
        stream: false,
      });

      const content = completion.choices[0]?.message?.content;
      
      // Handle content which might be string or array
      const textContent = typeof content === "string" 
        ? content 
        : Array.isArray(content) 
          ? content.map(item => typeof item === "string" ? item : "").join("")
          : "";

      if (!textContent) {
        throw new Error("No content in OpenRouter response");
      }

      this.logger.log(
        `Received completion response (${textContent.length} characters)`
      );

      return textContent;
    } catch (error) {
      this.logger.error("Error calling OpenRouter API", error);
      throw new Error(
        `OpenRouter API error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Generate streaming completion (for future use)
   * @param prompt - The prompt to send to the AI
   * @param onChunk - Callback for each chunk received
   * @param options - Optional parameters
   */
  async completeStreaming(
    prompt: string,
    onChunk: (chunk: string) => void,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    }
  ): Promise<void> {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error(
        "OPENROUTER_API_KEY is not configured. Please set it in environment variables."
      );
    }

    try {
      const messages: Array<{ role: "system" | "user"; content: string }> = [];

      if (options?.systemPrompt) {
        messages.push({
          role: "system",
          content: options.systemPrompt,
        });
      }

      messages.push({
        role: "user",
        content: prompt,
      });

      this.logger.log(
        `Sending streaming completion request to model: ${options?.model || this.defaultModel}`
      );

      const stream = await this.client.chat.send({
        model: options?.model || this.defaultModel,
        messages,
        temperature: options?.temperature,
        maxTokens: options?.maxTokens,
        stream: true,
      });

      // Type guard to check if it's a stream
      if (typeof stream[Symbol.asyncIterator] === "function") {
        for await (const chunk of stream as AsyncIterable<{
          choices: Array<{ delta?: { content?: string } }>;
        }>) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            onChunk(content);
          }
        }
      }

      this.logger.log("Streaming completion finished");
    } catch (error) {
      this.logger.error("Error calling OpenRouter streaming API", error);
      throw new Error(
        `OpenRouter streaming API error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Test OpenRouter connection
   * @returns true if connection is working
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.complete("Say 'OK' if you can hear me.", {
        maxTokens: 10,
      });
      return response.length > 0;
    } catch (error) {
      this.logger.error("OpenRouter connection test failed", error);
      return false;
    }
  }
}

