import type { ProfileDTO, CreateProfileCommand, UpdateProfileCommand, DietType } from "../../types";

// ============================================================================
// ViewModel Types
// ============================================================================

/**
 * Profile operation mode
 */
export type ProfileOperation = "create" | "update";

/**
 * Profile Form Values (ViewModel)
 * Used in the profile form - client-side representation
 */
export interface ProfileFormValues {
  dietType: DietType | null;
  dislikedIngredients: string[];
  preferredCuisines: string[];
}

// ============================================================================
// Mapping Functions
// ============================================================================

/**
 * Maps ProfileDTO from API to ProfileFormValues for form initialization
 * @param dto - Profile DTO from GET /api/profile
 * @returns ProfileFormValues for form
 */
export function profileDtoToFormValues(dto: ProfileDTO): ProfileFormValues {
  return {
    dietType: dto.diet_type ?? null,
    dislikedIngredients: dto.disliked_ingredients ?? [],
    preferredCuisines: dto.preferred_cuisines ?? [],
  };
}

/**
 * Creates empty ProfileFormValues
 * @returns Empty form values for create mode
 */
export function emptyProfileFormValues(): ProfileFormValues {
  return {
    dietType: null,
    dislikedIngredients: [],
    preferredCuisines: [],
  };
}

/**
 * Maps ProfileFormValues to CreateProfileCommand for POST /api/profile
 * Only includes non-empty fields (at least one field must be present per PRD)
 * @param values - Form values
 * @returns CreateProfileCommand for API
 */
export function formValuesToCreateCommand(values: ProfileFormValues): CreateProfileCommand {
  const command: CreateProfileCommand = {};

  if (values.dietType) {
    command.diet_type = values.dietType;
  }

  if (values.dislikedIngredients.length > 0) {
    command.disliked_ingredients = values.dislikedIngredients;
  }

  if (values.preferredCuisines.length > 0) {
    command.preferred_cuisines = values.preferredCuisines;
  }

  return command;
}

/**
 * Maps ProfileFormValues to UpdateProfileCommand for PUT /api/profile
 * Includes only changed fields compared to initial values
 * Uses null to clear diet_type field
 * @param values - Current form values
 * @param initialValues - Initial form values (from server)
 * @returns UpdateProfileCommand for API
 */
export function formValuesToUpdateCommand(
  values: ProfileFormValues,
  initialValues: ProfileFormValues
): UpdateProfileCommand {
  const command: UpdateProfileCommand = {};

  // Check if dietType changed
  if (values.dietType !== initialValues.dietType) {
    command.diet_type = values.dietType;
  }

  // Check if dislikedIngredients changed
  if (!arraysEqual(values.dislikedIngredients, initialValues.dislikedIngredients)) {
    command.disliked_ingredients = values.dislikedIngredients;
  }

  // Check if preferredCuisines changed
  if (!arraysEqual(values.preferredCuisines, initialValues.preferredCuisines)) {
    command.preferred_cuisines = values.preferredCuisines;
  }

  return command;
}

// ============================================================================
// Normalization and Validation Helpers
// ============================================================================

/**
 * Normalizes a tag/ingredient string array
 * - Trims whitespace
 * - Converts to lowercase
 * - Removes duplicates
 * - Filters out empty strings
 * @param items - Array of strings
 * @returns Normalized array
 */
export function normalizeStringArray(items: string[]): string[] {
  const normalized = items.map((item) => item.trim().toLowerCase()).filter((item) => item.length > 0);

  // Remove duplicates
  return Array.from(new Set(normalized));
}

/**
 * Validates that at least one field is filled (PRD requirement)
 * @param values - Form values
 * @returns true if at least one field has value
 */
export function hasAtLeastOneField(values: ProfileFormValues): boolean {
  return values.dietType !== null || values.dislikedIngredients.length > 0 || values.preferredCuisines.length > 0;
}

/**
 * Checks if form has changes compared to initial values
 * @param values - Current form values
 * @param initialValues - Initial form values
 * @returns true if form is dirty (has changes)
 */
export function isFormDirty(values: ProfileFormValues, initialValues: ProfileFormValues): boolean {
  return (
    values.dietType !== initialValues.dietType ||
    !arraysEqual(values.dislikedIngredients, initialValues.dislikedIngredients) ||
    !arraysEqual(values.preferredCuisines, initialValues.preferredCuisines)
  );
}

/**
 * Compares two string arrays for equality
 * @param a - First array
 * @param b - Second array
 * @returns true if arrays are equal
 */
function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, index) => val === sortedB[index]);
}
