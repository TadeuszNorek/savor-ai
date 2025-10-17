import { z } from "zod";

/**
 * Recipe sort order validation
 */
const RecipeSortOrderSchema = z.enum(["recent", "oldest"], {
  errorMap: () => ({ message: "Sort must be 'recent' or 'oldest'" }),
});

/**
 * Recipe query parameters validation schema
 * For GET /api/recipes endpoint
 */
export const RecipeListQuerySchema = z
  .object({
    // Full-text search across title, summary, ingredients
    search: z
      .string()
      .trim()
      .max(200, "Search query too long (max 200 characters)")
      .optional()
      .transform((val) => (val && val.length > 0 ? val : undefined)),

    // Comma-separated tags for OR filtering
    tags: z
      .string()
      .trim()
      .max(200, "Tags parameter too long (max 200 characters)")
      .optional()
      .transform((val) => {
        if (!val || val.length === 0) return undefined;
        // Normalize to lowercase and split
        return val
          .toLowerCase()
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0);
      }),

    // Sort order (default: recent)
    sort: RecipeSortOrderSchema.default("recent"),

    // Pagination limit (default: 20, range: 1-100)
    limit: z
      .string()
      .optional()
      .default("20")
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().int().min(1, "Limit must be at least 1").max(100, "Limit cannot exceed 100")),

    // Cursor-based pagination (Base64 encoded "created_at:id")
    cursor: z
      .string()
      .trim()
      .optional()
      .transform((val) => (val && val.length > 0 ? val : undefined)),

    // Offset-based pagination (alternative to cursor)
    offset: z
      .string()
      .optional()
      .transform((val) => (val && val.length > 0 ? parseInt(val, 10) : undefined))
      .pipe(z.number().int().nonnegative("Offset must be non-negative").optional()),
  })
  .strict()
  .refine(
    (data) => {
      // Cursor and offset are mutually exclusive
      return !(data.cursor !== undefined && data.offset !== undefined);
    },
    {
      message: "Cannot use both 'cursor' and 'offset' parameters",
      path: ["cursor"],
    }
  );

/**
 * Type inference for validated query params
 */
export type RecipeListQueryInput = z.input<typeof RecipeListQuerySchema>;
export type RecipeListQueryOutput = z.output<typeof RecipeListQuerySchema>;
