import { z } from 'zod';
import { L as LanguageCodeSchema } from './profile.schema_CiYfmczZ.mjs';

const DietaryInfoSchema = z.object({
  vegetarian: z.boolean().optional(),
  vegan: z.boolean().optional(),
  gluten_free: z.boolean().optional(),
  dairy_free: z.boolean().optional(),
  nut_free: z.boolean().optional()
}).catchall(z.boolean()).optional();
const NutritionSchema = z.object({
  calories: z.number().int().nonnegative().optional(),
  protein_g: z.number().nonnegative().optional(),
  carbs_g: z.number().nonnegative().optional(),
  fat_g: z.number().nonnegative().optional()
}).catchall(z.number()).optional();
const RecipeSchemaZ = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().max(500).optional(),
  description: z.string().max(2e3).optional(),
  prep_time_minutes: z.number().int().nonnegative().max(1440),
  // Max 24 hours
  cook_time_minutes: z.number().int().nonnegative().max(1440),
  // Max 24 hours
  servings: z.number().int().positive().max(100),
  difficulty: z.enum(["easy", "medium", "hard"]),
  cuisine: z.string().max(50).optional(),
  ingredients: z.array(z.string().min(1).max(500)).min(1).max(100),
  instructions: z.array(z.string().min(1).max(2e3)).min(1).max(50),
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
  dietary_info: DietaryInfoSchema,
  nutrition: NutritionSchema
});
const GenerateRecipeCommandSchema = z.object({
  prompt: z.string().trim().min(1, "Prompt cannot be empty").max(2e3, "Prompt too long (max 2000 characters)").refine(
    (val) => {
      const hasInvalidChars = /[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/.test(val);
      return !hasInvalidChars;
    },
    { message: "Prompt contains invalid control characters" }
  ).refine(
    (val) => {
      const suspiciousPatterns = [
        /ignore\s+(previous|all)\s+(instructions|prompts)/i,
        /system\s*:\s*/i,
        /assistant\s*:\s*/i
      ];
      return !suspiciousPatterns.some((pattern) => pattern.test(val));
    },
    { message: "Prompt contains suspicious patterns" }
  ),
  lang: LanguageCodeSchema.optional()
  // Optional language override (defaults to profile.preferred_language or 'en')
});
z.object({
  recipe: RecipeSchemaZ,
  generation_id: z.string().uuid(),
  generated_at: z.string().datetime()
});
const SaveRecipeCommandSchema = z.object({
  recipe: RecipeSchemaZ,
  tags: z.array(z.string().trim().min(1, "Tag cannot be empty").max(50, "Tag too long (max 50 characters)")).max(20, "Too many tags (max 20)").optional(),
  language: LanguageCodeSchema
  // Required - language in which recipe was generated
});
function normalizeTags(tags) {
  if (!tags || tags.length === 0) {
    return [];
  }
  const normalized = tags.map((tag) => tag.trim().toLowerCase()).filter((tag) => tag.length > 0);
  return Array.from(new Set(normalized));
}

export { GenerateRecipeCommandSchema as G, RecipeSchemaZ as R, SaveRecipeCommandSchema as S, normalizeTags as n };
