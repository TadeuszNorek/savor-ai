import type { RecipeSchema, ProfileDTO } from "../../../../types";
import type { AiProvider, AiProviderConfig } from "../types";
import { AiProviderError, AiValidationError } from "../types";
import { RecipePromptBuilder } from "../utils/recipe-prompt-builder";
import { RecipeResponseParser } from "../utils/recipe-response-parser";
import { LLMRequestManager } from "../utils/llm-request-manager";

/**
 * OpenRouter API Provider
 * Implements the AiProvider interface using OpenRouter's API
 * Uses centralized utilities for prompt building, response parsing, and request management
 */
export class OpenRouterProvider implements AiProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeout: number;
  private readonly baseUrl = "https://openrouter.ai/api/v1";
  private readonly providerName = "OpenRouter";

  constructor(config: AiProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || "deepseek/deepseek-r1-0528:free";
    this.timeout = config.timeout || 30000; // 30 seconds default
  }

  async generateRecipe(prompt: string, profile?: ProfileDTO): Promise<RecipeSchema> {
    // Build prompts using shared utility
    const systemPrompt = RecipePromptBuilder.buildSystemPrompt(profile);
    const userPrompt = RecipePromptBuilder.buildUserPrompt(prompt);

    try {
      // Execute request with timeout handling
      const response = await LLMRequestManager.executeWithTimeout(
        (signal) =>
          fetch(`${this.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${this.apiKey}`,
              "HTTP-Referer": "https://savor-ai.app", // Optional: for OpenRouter analytics
              "X-Title": "Savor AI Recipe Generator",
            },
            body: JSON.stringify({
              model: this.model,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
              temperature: 0.7,
              max_tokens: 4000,
            }),
            signal,
          }),
        this.timeout,
        this.providerName
      );

      // Handle HTTP errors
      await LLMRequestManager.handleResponseError(response, this.providerName);

      // Parse response JSON
      const data = await response.json();

      // Extract content from OpenRouter response format
      const content = LLMRequestManager.extractContent(
        data,
        ["choices", "0", "message", "content"],
        this.providerName
      );

      // Parse and validate recipe using shared utility
      const validated = RecipeResponseParser.parseAndValidate(content);

      return validated;
    } catch (error: unknown) {
      // Re-throw known error types
      if (
        error instanceof AiProviderError ||
        error instanceof AiValidationError ||
        (error instanceof Error && error.constructor.name === "AiTimeoutError")
      ) {
        throw error;
      }

      // Wrap unknown errors
      LLMRequestManager.handleNetworkError(error, this.providerName);
    }
  }
}
