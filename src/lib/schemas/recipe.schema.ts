import { z } from "zod";
import type { RecipeSchema } from "../../types";

/**
 * Zod schema for dietary information
 */
const DietaryInfoSchema = z
  .object({
    vegetarian: z.boolean().optional(),
    vegan: z.boolean().optional(),
    gluten_free: z.boolean().optional(),
    dairy_free: z.boolean().optional(),
    nut_free: z.boolean().optional(),
  })
  .catchall(z.boolean())
  .optional();

/**
 * Zod schema for nutrition information
 */
const NutritionSchema = z
  .object({
    calories: z.number().int().nonnegative().optional(),
    protein_g: z.number().nonnegative().optional(),
    carbs_g: z.number().nonnegative().optional(),
    fat_g: z.number().nonnegative().optional(),
  })
  .catchall(z.number())
  .optional();

/**
 * Zod schema for RecipeSchema
 * Validates the complete recipe structure from AI generation
 */
export const RecipeSchemaZ = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
  prep_time_minutes: z.number().int().nonnegative().max(1440), // Max 24 hours
  cook_time_minutes: z.number().int().nonnegative().max(1440), // Max 24 hours
  servings: z.number().int().positive().max(100),
  difficulty: z.enum(["easy", "medium", "hard"]),
  cuisine: z.string().max(50).optional(),
  ingredients: z.array(z.string().min(1).max(500)).min(1).max(100),
  instructions: z.array(z.string().min(1).max(2000)).min(1).max(50),
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
  dietary_info: DietaryInfoSchema,
  nutrition: NutritionSchema,
}) satisfies z.ZodType<RecipeSchema>;

/**
 * Zod schema for GenerateRecipeCommand
 * Validates the prompt input with sanity checks
 */
export const GenerateRecipeCommandSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(1, "Prompt cannot be empty")
    .max(2000, "Prompt too long (max 2000 characters)")
    .refine(
      (val) => {
        // Basic sanity check: no control characters except newlines and tabs
        // eslint-disable-next-line no-control-regex
        const hasInvalidChars = /[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/.test(val);
        return !hasInvalidChars;
      },
      { message: "Prompt contains invalid control characters" }
    )
    .refine(
      (val) => {
        // Soft check for potential prompt injection patterns
        const suspiciousPatterns = [
          /ignore\s+(previous|all)\s+(instructions|prompts)/i,
          /system\s*:\s*/i,
          /assistant\s*:\s*/i,
        ];
        return !suspiciousPatterns.some((pattern) => pattern.test(val));
      },
      { message: "Prompt contains suspicious patterns" }
    ),
});

/**
 * Zod schema for GenerateRecipeResponse
 */
export const GenerateRecipeResponseSchema = z.object({
  recipe: RecipeSchemaZ,
  generation_id: z.string().uuid(),
  generated_at: z.string().datetime(),
});

/**
 * Zod schema for SaveRecipeCommand
 * Validates recipe save request with optional tags
 */
export const SaveRecipeCommandSchema = z.object({
  recipe: RecipeSchemaZ,
  tags: z
    .array(z.string().trim().min(1, "Tag cannot be empty").max(50, "Tag too long (max 50 characters)"))
    .max(20, "Too many tags (max 20)")
    .optional(),
});

/**
 * Helper function to normalize tags
 * Converts to lowercase, trims whitespace, removes duplicates and empty strings
 * @param tags - Array of tag strings to normalize
 * @returns Normalized array of unique lowercase tags
 */
export function normalizeTags(tags: string[] | undefined): string[] {
  if (!tags || tags.length === 0) {
    return [];
  }

  const normalized = tags.map((tag) => tag.trim().toLowerCase()).filter((tag) => tag.length > 0);

  // Remove duplicates while preserving order
  return Array.from(new Set(normalized));
}

/**
 * Type inference helpers
 */
export type RecipeSchemaInput = z.input<typeof RecipeSchemaZ>;
export type RecipeSchemaOutput = z.output<typeof RecipeSchemaZ>;
export type GenerateRecipeCommandInput = z.input<typeof GenerateRecipeCommandSchema>;
export type SaveRecipeCommandInput = z.input<typeof SaveRecipeCommandSchema>;
