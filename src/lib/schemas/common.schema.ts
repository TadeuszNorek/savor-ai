import { z } from "zod";

/**
 * Common validation schemas
 * Shared across multiple endpoints
 */

/**
 * UUID validation schema
 * Validates that a string is a valid UUID v4
 */
export const UuidSchema = z.string().uuid({
  message: "Invalid UUID format",
});

/**
 * Validate UUID parameter
 * Returns validated UUID or throws ZodError
 */
export function validateUuid(value: unknown): string {
  return UuidSchema.parse(value);
}
