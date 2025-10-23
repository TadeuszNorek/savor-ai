import type { RecipeSchema, ProfileDTO } from "../../../../types";
import type { AiProvider, AiProviderConfig } from "../types";
import { AiProviderError, AiValidationError } from "../types";
import { RecipePromptBuilder } from "../utils/recipe-prompt-builder";
import { RecipeResponseParser } from "../utils/recipe-response-parser";
import { LLMRequestManager } from "../utils/llm-request-manager";

/**
 * Google AI Studio Provider
 * Implements the AiProvider interface using Google's Gemini API
 * Uses centralized utilities for prompt building, response parsing, and request management
 */
export class GoogleProvider implements AiProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeout: number;
  private readonly baseUrl = "https://generativelanguage.googleapis.com/v1beta";
  private readonly providerName = "Google AI";

  constructor(config: AiProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || "gemini-1.5-flash"; // Default to Flash for speed/cost
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
          fetch(`${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      text: `${systemPrompt}\n\n${userPrompt}`,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 4000,
                responseMimeType: "application/json", // Request JSON response
              },
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

      // Extract content from Google AI response format
      const content = LLMRequestManager.extractContent(
        data,
        ["candidates", "0", "content", "parts", "0", "text"],
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
