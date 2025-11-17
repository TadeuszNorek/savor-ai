import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { DietTypeSelect } from "./profile/DietTypeSelect";
import { TagsInput } from "./profile/TagsInput";
import { useI18n } from "../lib/contexts/I18nContext";
import {
  normalizeStringArray,
  hasAtLeastOneField,
  isFormDirty,
  type ProfileFormValues,
  type ProfileOperation,
} from "../lib/mappers/profile";
import type { DietType } from "../types";

interface ProfileFormProps {
  /** Initial form values (from server or empty) */
  initialValues: ProfileFormValues;
  /** Form mode - create or update */
  mode: ProfileOperation;
  /** Submit handler - called with validated form values */
  onSubmit: (values: ProfileFormValues) => Promise<void>;
}

/**
 * ProfileForm Component
 *
 * Controlled form for editing dietary preferences profile.
 * Includes three fields: dietType, dislikedIngredients, preferredCuisines.
 *
 * Features:
 * - Client-side validation (≥1 field required, max 100 items, max 50 chars per item)
 * - Auto-normalization (lowercase, trim, dedupe)
 * - Dirty checking (disable save if no changes in update mode)
 * - Focus management (focuses first error field on validation failure)
 * - Full ARIA support for screen readers
 * - Inline error messages with role="alert"
 *
 * @component
 */
export function ProfileForm({ initialValues, mode, onSubmit }: ProfileFormProps) {
  const [values, setValues] = useState<ProfileFormValues>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormValues, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { lang } = useI18n();

  // Refs for focus management
  const dietTypeRef = useRef<HTMLButtonElement>(null);
  const dislikedIngredientsRef = useRef<HTMLInputElement>(null);
  const preferredCuisinesRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Update form values when initialValues change
  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  // Validate form
  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ProfileFormValues, string>> = {};

    // Check if at least one field is filled
    if (!hasAtLeastOneField(values)) {
      newErrors.dietType = "At least one field must be filled";
      setErrors(newErrors);
      return false;
    }

    // Validate disliked ingredients
    if (values.dislikedIngredients.length > 100) {
      newErrors.dislikedIngredients = "Maximum 100 ingredients allowed";
    }

    for (const ingredient of values.dislikedIngredients) {
      if (ingredient.length > 50) {
        newErrors.dislikedIngredients = "Each ingredient must be 50 characters or less";
        break;
      }
    }

    // Validate preferred cuisines
    if (values.preferredCuisines.length > 100) {
      newErrors.preferredCuisines = "Maximum 100 cuisines allowed";
    }

    for (const cuisine of values.preferredCuisines) {
      if (cuisine.length > 50) {
        newErrors.preferredCuisines = "Each cuisine must be 50 characters or less";
        break;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      // Focus on first field with error
      if (errors.dietType) {
        dietTypeRef.current?.focus();
      } else if (errors.dislikedIngredients) {
        dislikedIngredientsRef.current?.focus();
      } else if (errors.preferredCuisines) {
        preferredCuisinesRef.current?.focus();
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle field changes
  const handleDietTypeChange = (dietType: DietType | null) => {
    setValues((prev) => ({ ...prev, dietType }));
    setErrors((prev) => ({ ...prev, dietType: undefined }));
  };

  const handleDislikedIngredientsChange = (ingredients: string[]) => {
    const normalized = normalizeStringArray(ingredients);
    setValues((prev) => ({ ...prev, dislikedIngredients: normalized }));
    setErrors((prev) => ({ ...prev, dislikedIngredients: undefined }));
  };

  const handlePreferredCuisinesChange = (cuisines: string[]) => {
    const normalized = normalizeStringArray(cuisines);
    setValues((prev) => ({ ...prev, preferredCuisines: normalized }));
    setErrors((prev) => ({ ...prev, preferredCuisines: undefined }));
  };

  // Check if form is valid and dirty
  const isDirty = isFormDirty(values, initialValues);
  const isValid = hasAtLeastOneField(values);
  const canSubmit = isValid && (mode === "create" || isDirty) && !isSubmitting;

  return (
    <form onSubmit={handleSubmit} ref={formRef} aria-label="Profile preferences form">
      <Card>
        <CardHeader>
          <CardTitle>{mode === "create" ? "Create Profile" : "Edit Profile"}</CardTitle>
          <CardDescription>
            {mode === "create"
              ? "Set up your dietary preferences to get started."
              : "Update your dietary preferences to refine your recommendations."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Diet Type */}
          <div className="space-y-2">
            <Label htmlFor="dietType">Diet Type (Optional)</Label>
            <DietTypeSelect
              value={values.dietType}
              onChange={handleDietTypeChange}
              ref={dietTypeRef}
              aria-invalid={!!errors.dietType}
              aria-describedby={errors.dietType ? "dietType-error" : "dietType-helper"}
            />
            {errors.dietType && (
              <p id="dietType-error" className="text-sm text-destructive" role="alert">
                {errors.dietType}
              </p>
            )}
            <p id="dietType-helper" className="text-sm text-muted-foreground">
              Select your dietary preference to filter recipes accordingly.
            </p>
          </div>

          {/* Disliked Ingredients */}
          <div className="space-y-2">
            <Label htmlFor="dislikedIngredients">Disliked Ingredients (Optional)</Label>
            <TagsInput
              name="dislikedIngredients"
              value={values.dislikedIngredients}
              onChange={handleDislikedIngredientsChange}
              placeholder="Add ingredients you want to avoid..."
              ref={dislikedIngredientsRef}
              aria-invalid={!!errors.dislikedIngredients}
              aria-describedby={errors.dislikedIngredients ? "dislikedIngredients-error" : "dislikedIngredients-helper"}
            />
            {errors.dislikedIngredients && (
              <p id="dislikedIngredients-error" className="text-sm text-destructive" role="alert">
                {errors.dislikedIngredients}
              </p>
            )}
            <p id="dislikedIngredients-helper" className="text-sm text-muted-foreground">
              Recipes containing these ingredients will be blocked from saving.{" "}
              <strong className="text-foreground">
                Enter in {lang === "pl" ? "Polish" : "English"} (current UI language).
              </strong>
            </p>
          </div>

          {/* Preferred Cuisines */}
          <div className="space-y-2">
            <Label htmlFor="preferredCuisines">Preferred Cuisines (Optional)</Label>
            <TagsInput
              name="preferredCuisines"
              value={values.preferredCuisines}
              onChange={handlePreferredCuisinesChange}
              placeholder="Add cuisines you enjoy..."
              ref={preferredCuisinesRef}
              aria-invalid={!!errors.preferredCuisines}
              aria-describedby={errors.preferredCuisines ? "preferredCuisines-error" : "preferredCuisines-helper"}
            />
            {errors.preferredCuisines && (
              <p id="preferredCuisines-error" className="text-sm text-destructive" role="alert">
                {errors.preferredCuisines}
              </p>
            )}
            <p id="preferredCuisines-helper" className="text-sm text-muted-foreground">
              We&apos;ll prioritize recipes from these cuisines in your recommendations.{" "}
              <strong className="text-foreground">
                Enter in {lang === "pl" ? "Polish" : "English"} (current UI language).
              </strong>
            </p>
          </div>

          {/* General validation error */}
          {!isValid && (
            <div className="text-sm text-destructive" role="alert" aria-live="polite">
              Please fill in at least one field to save your profile.
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!canSubmit}
            className="w-full"
            aria-label={
              isSubmitting ? "Saving profile" : mode === "create" ? "Create profile" : "Save changes to profile"
            }
          >
            {isSubmitting ? "Saving..." : mode === "create" ? "Create Profile" : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
