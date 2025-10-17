import type { RecipeSchema, ProfileDTO } from "../../../types";

/**
 * AI Provider interface
 * All AI providers must implement this interface
 */
export interface AiProvider {
  /**
   * Generate a recipe based on user prompt and profile
   * @param prompt - User's recipe request
   * @param profile - User's profile with dietary preferences (optional)
   * @returns Generated recipe matching RecipeSchema
   */
  generateRecipe(prompt: string, profile?: ProfileDTO): Promise<RecipeSchema>;
}

/**
 * AI Generation Result
 * Extended result type with optional raw response for debugging
 */
export interface AiGenerationResult {
  recipe: RecipeSchema;
  raw?: unknown; // Raw API response for server-side debugging
}

/**
 * AI Provider Configuration
 */
export interface AiProviderConfig {
  apiKey: string;
  model?: string;
  timeout?: number; // Timeout in milliseconds
  maxRetries?: number;
}

/**
 * AI Error Types
 */
export class AiError extends Error {
  constructor(
    message: string,
    public readonly isRetryable: boolean = false,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = "AiError";
  }
}

export class AiTimeoutError extends AiError {
  constructor(message: string = "AI request timed out") {
    super(message, true);
    this.name = "AiTimeoutError";
  }
}

export class AiValidationError extends AiError {
  constructor(message: string = "AI response validation failed") {
    super(message, false);
    this.name = "AiValidationError";
  }
}

export class AiProviderError extends AiError {
  constructor(
    message: string,
    public readonly statusCode?: number
  ) {
    // 5xx errors are retryable, 4xx are not
    super(message, statusCode ? statusCode >= 500 : false);
    this.name = "AiProviderError";
  }
}
