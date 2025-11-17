import { z } from "zod";

/**
 * Language Code Schema
 * Must match LanguageCode in src/types.ts and CHECK constraint in database
 */
export const LanguageCodeSchema = z.enum(['pl', 'en'], {
  errorMap: () => ({ message: "Language must be 'pl' or 'en'" }),
});

/**
 * Diet Type Schema
 * Must match DietType in src/types.ts and CHECK constraint in database
 */
const DietTypeSchema = z.enum([
  "vegan",
  "vegetarian",
  "pescatarian",
  "keto",
  "paleo",
  "gluten_free",
  "dairy_free",
  "low_carb",
  "mediterranean",
  "omnivore",
]);

/**
 * String Array Normalizer
 * Transforms array of strings by:
 * - Converting to lowercase
 * - Trimming whitespace
 * - Filtering out empty strings
 * - Removing duplicates
 */
const normalizeStringArray = (arr: string[]): string[] => {
  const normalized = arr.map((item) => item.trim().toLowerCase()).filter((item) => item.length > 0);

  // Remove duplicates
  return [...new Set(normalized)];
};

/**
 * String Array Schema
 * Validates and normalizes string arrays for ingredients and cuisines
 * - Each string: 1-50 characters after trim
 * - Max 100 items in array
 * - Automatically normalizes to lowercase, trims, deduplicates
 */
const StringArraySchema = z
  .array(z.string().min(1, "Item cannot be empty").max(50, "Item cannot exceed 50 characters"))
  .max(100, "Array cannot exceed 100 items")
  .transform(normalizeStringArray);

/**
 * Create Profile Command Schema
 * Validates the body of POST /api/profile
 *
 * Rules:
 * - diet_type: Optional, must be one of the allowed DietType values
 * - disliked_ingredients: Optional array of strings (1-50 chars each, max 100 items)
 *   Automatically normalized: lowercase, trimmed, deduplicated, empty filtered
 * - preferred_cuisines: Optional array of strings (same rules as disliked_ingredients)
 * - preferred_language: Optional, defaults to 'en' (English)
 * - All fields are optional as user can create empty profile
 */
export const CreateProfileCommandSchema = z
  .object({
    diet_type: DietTypeSchema.optional(),
    disliked_ingredients: StringArraySchema.optional(),
    preferred_cuisines: StringArraySchema.optional(),
    preferred_language: LanguageCodeSchema.optional().default('en'),
  })
  .strict();

/**
 * Update Profile Command Schema
 * Validates the body of PUT /api/profile
 *
 * Rules:
 * - All fields optional for partial updates
 * - At least one field must be provided
 * - diet_type can be explicitly set to null to clear the value
 * - preferred_language can be updated to change user's language preference
 */
export const UpdateProfileCommandSchema = z
  .object({
    diet_type: DietTypeSchema.nullish(),
    disliked_ingredients: StringArraySchema.optional(),
    preferred_cuisines: StringArraySchema.optional(),
    preferred_language: LanguageCodeSchema.optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.diet_type !== undefined ||
      data.disliked_ingredients !== undefined ||
      data.preferred_cuisines !== undefined ||
      data.preferred_language !== undefined,
    {
      message: "At least one field must be provided for update",
      path: ["_root"],
    }
  );

/**
 * Type inference for CreateProfileCommand after Zod validation
 */
export type CreateProfileCommandInput = z.infer<typeof CreateProfileCommandSchema>;

/**
 * Type inference for UpdateProfileCommand after Zod validation
 */
export type UpdateProfileCommandInput = z.infer<typeof UpdateProfileCommandSchema>;
