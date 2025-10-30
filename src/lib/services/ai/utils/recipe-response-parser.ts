import type { RecipeSchema } from "../../../../types";
import { RecipeSchemaZ } from "../../../schemas/recipe.schema";
import { AiValidationError } from "../types";

/**
 * Parse and validate recipe JSON from AI response
 * @param content - Raw content from AI API
 * @returns Validated RecipeSchema
 * @throws AiValidationError if parsing or validation fails
 */
export function parseAndValidate(content: string): RecipeSchema {
  // Step 1: Extract JSON from markdown if needed
  const rawJson = extractJSON(content);

  // Step 2: Parse JSON string to object
  const parsed = parseJSON(rawJson);

  // Step 3: Validate against RecipeSchema
  const validated = validateSchema(parsed);

  return validated;
}

/**
 * Extract JSON from markdown code blocks if present (internal helper)
 * Handles formats:
 * - ```json ... ```
 * - ``` ... ```
 * - Plain JSON
 * @param content - Raw content string
 * @returns Cleaned JSON string
 */
function extractJSON(content: string): string {
  const cleaned = content.trim();

  // Check for markdown code blocks: ```json ... ``` or ``` ... ```
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // No code block found, return as-is
  return cleaned;
}

/**
 * Parse JSON string to object (internal helper)
 * @param jsonString - JSON string to parse
 * @returns Parsed object
 * @throws AiValidationError if JSON parsing fails
 */
function parseJSON(jsonString: string): unknown {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new AiValidationError(`Failed to parse recipe JSON: ${message}`);
  }
}

/**
 * Validate parsed object against RecipeSchema using Zod (internal helper)
 * @param data - Parsed JSON data
 * @returns Validated RecipeSchema
 * @throws AiValidationError if schema validation fails
 */
function validateSchema(data: unknown): RecipeSchema {
  try {
    return RecipeSchemaZ.parse(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown validation error";
    throw new AiValidationError(`Recipe schema validation failed: ${message}`);
  }
}
