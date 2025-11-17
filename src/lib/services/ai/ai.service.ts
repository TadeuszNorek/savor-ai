import type { RecipeSchema, ProfileDTO, LanguageCode } from "../../../types";
import { DEFAULT_LANGUAGE } from "../../../types";
import { OpenRouterProvider } from "./providers/openrouter.provider";
import { GoogleProvider } from "./providers/google.provider";
import { MockProvider } from "./providers/mock.provider";
import type { AiProvider } from "./types";
import { AiError } from "./types";

/**
 * AI Service Configuration
 */
export interface AiServiceConfig {
  provider: "openrouter" | "google" | "mock";
  apiKey?: string; // Optional for mock provider
  model?: string;
  timeout?: number;
  maxRetries?: number;
}

/**
 * AI Service
 * Facade for AI recipe generation with provider selection and retry logic
 */
export class AiService {
  private provider: AiProvider;
  private maxRetries: number;
  private retryDelay = 500; // Base delay in ms for exponential backoff

  constructor(config: AiServiceConfig) {
    this.maxRetries = config.maxRetries ?? 1; // Default: 1 retry as per spec

    // Initialize the appropriate provider
    switch (config.provider) {
      case "mock":
        // Mock provider doesn't need API key
        this.provider = new MockProvider({
          timeout: config.timeout,
        });
        break;
      case "openrouter":
        if (!config.apiKey) {
          throw new Error("API key is required for OpenRouter provider");
        }
        this.provider = new OpenRouterProvider({
          apiKey: config.apiKey,
          model: config.model,
          timeout: config.timeout,
        });
        break;
      case "google":
        if (!config.apiKey) {
          throw new Error("API key is required for Google provider");
        }
        this.provider = new GoogleProvider({
          apiKey: config.apiKey,
          model: config.model,
          timeout: config.timeout,
        });
        break;
      default:
        throw new Error(`Unknown AI provider: ${config.provider}`);
    }
  }

  /**
   * Generate a recipe with retry logic
   * @param prompt - User's recipe request
   * @param profile - User's profile with dietary preferences (optional)
   * @param lang - Language override (optional, defaults to profile.preferred_language or DEFAULT_LANGUAGE)
   * @returns Generated recipe matching RecipeSchema
   */
  async generateRecipe(prompt: string, profile?: ProfileDTO, lang?: LanguageCode): Promise<RecipeSchema> {
    // Determine final language: explicit override > profile preference > default 'en'
    const recipeLanguage: LanguageCode = lang ?? profile?.preferred_language ?? DEFAULT_LANGUAGE;

    let lastError: Error | undefined;
    let attempt = 0;
    const maxAttempts = this.maxRetries + 1; // Initial attempt + retries

    while (attempt < maxAttempts) {
      try {
        console.log(`AI generation attempt ${attempt + 1}/${maxAttempts} (language: ${recipeLanguage})`);
        const recipe = await this.provider.generateRecipe(prompt, profile, recipeLanguage);

        // Validate size constraint (200KB limit as per DB CHECK)
        this.validateRecipeSize(recipe);

        return recipe;
      } catch (error) {
        lastError = error as Error;
        attempt++;

        // Check if error is retryable
        const isRetryable = error instanceof AiError && error.isRetryable;

        if (!isRetryable || attempt >= maxAttempts) {
          // Don't retry non-retryable errors or if we've exhausted attempts
          break;
        }

        // Calculate backoff delay with jitter
        const delay = this.calculateBackoff(attempt);
        console.log(`AI request failed (retryable), waiting ${delay}ms before retry...`);
        await this.sleep(delay);
      }
    }

    // All attempts failed
    throw lastError || new Error("AI generation failed with unknown error");
  }

  /**
   * Validate recipe size doesn't exceed 200KB limit
   * Throws error if size exceeded
   */
  private validateRecipeSize(recipe: RecipeSchema): void {
    const json = JSON.stringify(recipe);
    const sizeBytes = Buffer.byteLength(json, "utf8");
    const maxBytes = 200 * 1024; // 200KB

    if (sizeBytes > maxBytes) {
      throw new Error(`Generated recipe exceeds size limit: ${sizeBytes} bytes (max ${maxBytes} bytes)`);
    }
  }

  /**
   * Calculate exponential backoff with jitter
   */
  private calculateBackoff(attempt: number): number {
    const baseDelay = this.retryDelay;
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.3 * exponentialDelay; // 30% jitter
    return Math.min(exponentialDelay + jitter, 5000); // Cap at 5 seconds
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Factory method to create AiService from environment variables
   */
  static fromEnv(): AiService {
    const provider = import.meta.env.AI_PROVIDER as "openrouter" | "google" | "mock" | undefined;

    if (!provider) {
      throw new Error("AI_PROVIDER environment variable not set");
    }

    if (provider !== "openrouter" && provider !== "google" && provider !== "mock") {
      throw new Error(`Invalid AI_PROVIDER: ${provider}. Must be 'openrouter', 'google', or 'mock'`);
    }

    // Mock provider doesn't need API key
    if (provider === "mock") {
      return new AiService({
        provider: "mock",
        timeout: import.meta.env.AI_TIMEOUT_MS ? parseInt(import.meta.env.AI_TIMEOUT_MS, 10) : undefined,
      });
    }

    // Real providers need API keys
    const apiKey = provider === "openrouter" ? import.meta.env.OPENROUTER_API_KEY : import.meta.env.GOOGLE_API_KEY;

    if (!apiKey) {
      const keyName = provider === "openrouter" ? "OPENROUTER_API_KEY" : "GOOGLE_API_KEY";
      throw new Error(`${keyName} environment variable not set`);
    }

    return new AiService({
      provider,
      apiKey,
      model: import.meta.env.AI_MODEL,
      timeout: import.meta.env.AI_TIMEOUT_MS ? parseInt(import.meta.env.AI_TIMEOUT_MS, 10) : undefined,
    });
  }
}
