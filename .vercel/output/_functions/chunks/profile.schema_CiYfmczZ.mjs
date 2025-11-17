import { z } from 'zod';

const LanguageCodeSchema = z.enum(["pl", "en"], {
  errorMap: () => ({ message: "Language must be 'pl' or 'en'" })
});
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
  "omnivore"
]);
const normalizeStringArray = (arr) => {
  const normalized = arr.map((item) => item.trim().toLowerCase()).filter((item) => item.length > 0);
  return [...new Set(normalized)];
};
const StringArraySchema = z.array(z.string().min(1, "Item cannot be empty").max(50, "Item cannot exceed 50 characters")).max(100, "Array cannot exceed 100 items").transform(normalizeStringArray);
const CreateProfileCommandSchema = z.object({
  diet_type: DietTypeSchema.optional(),
  disliked_ingredients: StringArraySchema.optional(),
  preferred_cuisines: StringArraySchema.optional(),
  preferred_language: LanguageCodeSchema.optional().default("en")
}).strict();
const UpdateProfileCommandSchema = z.object({
  diet_type: DietTypeSchema.nullish(),
  disliked_ingredients: StringArraySchema.optional(),
  preferred_cuisines: StringArraySchema.optional(),
  preferred_language: LanguageCodeSchema.optional()
}).strict().refine(
  (data) => data.diet_type !== void 0 || data.disliked_ingredients !== void 0 || data.preferred_cuisines !== void 0 || data.preferred_language !== void 0,
  {
    message: "At least one field must be provided for update",
    path: ["_root"]
  }
);

export { CreateProfileCommandSchema as C, LanguageCodeSchema as L, UpdateProfileCommandSchema as U };
