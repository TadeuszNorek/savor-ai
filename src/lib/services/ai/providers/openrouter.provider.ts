import type { RecipeSchema, ProfileDTO } from "../../../../types";
import { RecipeSchemaZ } from "../../../schemas/recipe.schema";
import type { AiProvider, AiProviderConfig } from "../types";
import { AiProviderError, AiTimeoutError, AiValidationError } from "../types";

/**
 * OpenRouter API Provider
 * Implements the AiProvider interface using OpenRouter's API
 */
export class OpenRouterProvider implements AiProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeout: number;
  private readonly baseUrl = "https://openrouter.ai/api/v1";

  constructor(config: AiProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || "anthropic/claude-3.5-sonnet";
    this.timeout = config.timeout || 30000; // 30 seconds default
  }

  async generateRecipe(prompt: string, profile?: ProfileDTO): Promise<RecipeSchema> {
    const systemPrompt = this.buildSystemPrompt(profile);
    const userPrompt = this.buildUserPrompt(prompt);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
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
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new AiProviderError(`OpenRouter API error: ${errorText}`, response.status);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new AiValidationError("No content in OpenRouter response");
      }

      // Parse JSON from response (handle potential markdown code blocks)
      const recipe = this.parseRecipeJson(content);

      // Validate against schema
      const validated = RecipeSchemaZ.parse(recipe);

      return validated;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new AiTimeoutError(`OpenRouter request timed out after ${this.timeout}ms`);
      }

      if (error instanceof AiProviderError || error instanceof AiValidationError) {
        throw error;
      }

      // Network or unknown errors
      throw new AiProviderError(`OpenRouter request failed: ${(error as Error).message}`, undefined);
    }
  }

  /**
   * Build system prompt with dietary preferences
   */
  private buildSystemPrompt(profile?: ProfileDTO): string {
    let prompt = `You are a professional chef and recipe creator. Generate recipes in strict JSON format matching this structure:

{
  "title": "Recipe Title",
  "summary": "Brief one-sentence summary",
  "description": "Detailed description",
  "prep_time_minutes": 15,
  "cook_time_minutes": 30,
  "servings": 4,
  "difficulty": "easy|medium|hard",
  "cuisine": "Italian",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": ["step 1", "step 2"],
  "tags": ["tag1", "tag2"],
  "dietary_info": {
    "vegetarian": true,
    "vegan": false,
    "gluten_free": false,
    "dairy_free": false,
    "nut_free": true
  },
  "nutrition": {
    "calories": 350,
    "protein_g": 12,
    "carbs_g": 45,
    "fat_g": 10
  }
}

CRITICAL RULES:
- Return ONLY valid JSON, no markdown, no explanations
- All fields must match the types shown above
- ingredients and instructions must be non-empty arrays
- times and servings must be positive numbers
- difficulty must be exactly: "easy", "medium", or "hard"`;

    if (profile) {
      prompt += `\n\nUSER DIETARY PREFERENCES:`;
      if (profile.diet_type) {
        prompt += `\n- Diet type: ${profile.diet_type}`;
      }
      if (profile.disliked_ingredients && profile.disliked_ingredients.length > 0) {
        prompt += `\n- AVOID these ingredients: ${profile.disliked_ingredients.join(", ")}`;
      }
      if (profile.preferred_cuisines && profile.preferred_cuisines.length > 0) {
        prompt += `\n- Preferred cuisines: ${profile.preferred_cuisines.join(", ")}`;
      }
    }

    return prompt;
  }

  /**
   * Build user prompt from input
   */
  private buildUserPrompt(prompt: string): string {
    return `Create a recipe for: ${prompt}

Remember: Return ONLY valid JSON matching the exact structure specified in the system prompt.`;
  }

  /**
   * Parse recipe JSON from AI response
   * Handles markdown code blocks and extracts JSON
   */
  private parseRecipeJson(content: string): unknown {
    // Remove markdown code blocks if present
    let cleaned = content.trim();

    // Check for ```json ... ``` or ``` ... ```
    const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      cleaned = codeBlockMatch[1].trim();
    }

    try {
      return JSON.parse(cleaned);
    } catch (error) {
      throw new AiValidationError(`Failed to parse recipe JSON: ${(error as Error).message}`);
    }
  }
}
