import { describe, it, expect } from "vitest";
import {
  profileDtoToFormValues,
  emptyProfileFormValues,
  formValuesToCreateCommand,
  formValuesToUpdateCommand,
  normalizeStringArray,
  hasAtLeastOneField,
  isFormDirty,
  type ProfileFormValues,
} from "@/lib/mappers/profile";
import type { ProfileDTO } from "@/types";

describe("profile mappers", () => {
  describe("profileDtoToFormValues", () => {
    it("should map complete DTO to form values", () => {
      const dto: ProfileDTO = {
        id: "123",
        user_id: "user-123",
        diet_type: "vegan",
        disliked_ingredients: ["shellfish", "peanuts"],
        preferred_cuisines: ["italian", "japanese"],
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      const result = profileDtoToFormValues(dto);

      expect(result).toEqual({
        dietType: "vegan",
        dislikedIngredients: ["shellfish", "peanuts"],
        preferredCuisines: ["italian", "japanese"],
      });
    });

    it("should handle DTO with null diet_type", () => {
      const dto: ProfileDTO = {
        id: "123",
        user_id: "user-123",
        diet_type: null,
        disliked_ingredients: ["eggs"],
        preferred_cuisines: ["french"],
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      const result = profileDtoToFormValues(dto);

      expect(result.dietType).toBeNull();
      expect(result.dislikedIngredients).toEqual(["eggs"]);
      expect(result.preferredCuisines).toEqual(["french"]);
    });

    it("should handle DTO with null arrays", () => {
      const dto: ProfileDTO = {
        id: "123",
        user_id: "user-123",
        diet_type: "keto",
        disliked_ingredients: null,
        preferred_cuisines: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      const result = profileDtoToFormValues(dto);

      expect(result.dietType).toBe("keto");
      expect(result.dislikedIngredients).toEqual([]);
      expect(result.preferredCuisines).toEqual([]);
    });

    it("should handle completely empty DTO", () => {
      const dto: ProfileDTO = {
        id: "123",
        user_id: "user-123",
        diet_type: null,
        disliked_ingredients: null,
        preferred_cuisines: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      const result = profileDtoToFormValues(dto);

      expect(result).toEqual({
        dietType: null,
        dislikedIngredients: [],
        preferredCuisines: [],
      });
    });
  });

  describe("emptyProfileFormValues", () => {
    it("should return empty form values", () => {
      const result = emptyProfileFormValues();

      expect(result).toEqual({
        dietType: null,
        dislikedIngredients: [],
        preferredCuisines: [],
      });
    });

    it("should return new object on each call", () => {
      const result1 = emptyProfileFormValues();
      const result2 = emptyProfileFormValues();

      expect(result1).not.toBe(result2);
      expect(result1).toEqual(result2);
    });
  });

  describe("formValuesToCreateCommand", () => {
    it("should map complete form values to create command", () => {
      const values: ProfileFormValues = {
        dietType: "vegetarian",
        dislikedIngredients: ["meat", "fish"],
        preferredCuisines: ["indian", "thai"],
      };

      const result = formValuesToCreateCommand(values);

      expect(result).toEqual({
        diet_type: "vegetarian",
        disliked_ingredients: ["meat", "fish"],
        preferred_cuisines: ["indian", "thai"],
      });
    });

    it("should omit null diet_type", () => {
      const values: ProfileFormValues = {
        dietType: null,
        dislikedIngredients: ["eggs"],
        preferredCuisines: ["french"],
      };

      const result = formValuesToCreateCommand(values);

      expect(result).toEqual({
        disliked_ingredients: ["eggs"],
        preferred_cuisines: ["french"],
      });
      expect(result.diet_type).toBeUndefined();
    });

    it("should omit empty dislikedIngredients array", () => {
      const values: ProfileFormValues = {
        dietType: "paleo",
        dislikedIngredients: [],
        preferredCuisines: ["mexican"],
      };

      const result = formValuesToCreateCommand(values);

      expect(result).toEqual({
        diet_type: "paleo",
        preferred_cuisines: ["mexican"],
      });
      expect(result.disliked_ingredients).toBeUndefined();
    });

    it("should omit empty preferredCuisines array", () => {
      const values: ProfileFormValues = {
        dietType: "keto",
        dislikedIngredients: ["sugar"],
        preferredCuisines: [],
      };

      const result = formValuesToCreateCommand(values);

      expect(result).toEqual({
        diet_type: "keto",
        disliked_ingredients: ["sugar"],
      });
      expect(result.preferred_cuisines).toBeUndefined();
    });

    it("should return empty object for empty form values", () => {
      const values: ProfileFormValues = {
        dietType: null,
        dislikedIngredients: [],
        preferredCuisines: [],
      };

      const result = formValuesToCreateCommand(values);

      expect(result).toEqual({});
    });

    it("should include preferred_language when provided", () => {
      const values: ProfileFormValues = {
        dietType: "vegetarian",
        dislikedIngredients: ["meat"],
        preferredCuisines: ["italian"],
      };

      const result = formValuesToCreateCommand(values, "pl");

      expect(result).toEqual({
        diet_type: "vegetarian",
        disliked_ingredients: ["meat"],
        preferred_cuisines: ["italian"],
        preferred_language: "pl",
      });
    });

    it("should omit preferred_language when not provided", () => {
      const values: ProfileFormValues = {
        dietType: "vegan",
        dislikedIngredients: [],
        preferredCuisines: [],
      };

      const result = formValuesToCreateCommand(values);

      expect(result).toEqual({
        diet_type: "vegan",
      });
      expect(result.preferred_language).toBeUndefined();
    });
  });

  describe("formValuesToUpdateCommand", () => {
    const initialValues: ProfileFormValues = {
      dietType: "vegan",
      dislikedIngredients: ["shellfish", "peanuts"],
      preferredCuisines: ["italian", "japanese"],
    };

    it("should include only changed fields", () => {
      const values: ProfileFormValues = {
        dietType: "vegetarian", // changed
        dislikedIngredients: ["shellfish", "peanuts"], // same
        preferredCuisines: ["french"], // changed
      };

      const result = formValuesToUpdateCommand(values, initialValues);

      expect(result).toEqual({
        diet_type: "vegetarian",
        preferred_cuisines: ["french"],
      });
      expect(result.disliked_ingredients).toBeUndefined();
    });

    it("should detect diet_type change to null", () => {
      const values: ProfileFormValues = {
        dietType: null, // changed to null
        dislikedIngredients: ["shellfish", "peanuts"],
        preferredCuisines: ["italian", "japanese"],
      };

      const result = formValuesToUpdateCommand(values, initialValues);

      expect(result).toEqual({
        diet_type: null,
      });
    });

    it("should detect array order changes as same", () => {
      const values: ProfileFormValues = {
        dietType: "vegan",
        dislikedIngredients: ["peanuts", "shellfish"], // different order but same content
        preferredCuisines: ["japanese", "italian"], // different order but same content
      };

      const result = formValuesToUpdateCommand(values, initialValues);

      expect(result).toEqual({});
    });

    it("should detect array content changes", () => {
      const values: ProfileFormValues = {
        dietType: "vegan",
        dislikedIngredients: ["shellfish", "eggs"], // changed content
        preferredCuisines: ["italian", "japanese"],
      };

      const result = formValuesToUpdateCommand(values, initialValues);

      expect(result).toEqual({
        disliked_ingredients: ["shellfish", "eggs"],
      });
    });

    it("should detect empty array as change", () => {
      const values: ProfileFormValues = {
        dietType: "vegan",
        dislikedIngredients: [], // cleared
        preferredCuisines: ["italian", "japanese"],
      };

      const result = formValuesToUpdateCommand(values, initialValues);

      expect(result).toEqual({
        disliked_ingredients: [],
      });
    });

    it("should return empty object when nothing changed", () => {
      const values: ProfileFormValues = {
        dietType: "vegan",
        dislikedIngredients: ["shellfish", "peanuts"],
        preferredCuisines: ["italian", "japanese"],
      };

      const result = formValuesToUpdateCommand(values, initialValues);

      expect(result).toEqual({});
    });

    it("should handle all fields changing", () => {
      const values: ProfileFormValues = {
        dietType: "keto",
        dislikedIngredients: ["grains"],
        preferredCuisines: ["american"],
      };

      const result = formValuesToUpdateCommand(values, initialValues);

      expect(result).toEqual({
        diet_type: "keto",
        disliked_ingredients: ["grains"],
        preferred_cuisines: ["american"],
      });
    });
  });

  describe("normalizeStringArray", () => {
    it("should trim and lowercase items", () => {
      const items = ["  EGGS  ", "Milk", "  cheese  "];
      const result = normalizeStringArray(items);

      expect(result).toEqual(["eggs", "milk", "cheese"]);
    });

    it("should remove duplicates", () => {
      const items = ["eggs", "EGGS", "  eggs  ", "milk"];
      const result = normalizeStringArray(items);

      expect(result).toEqual(["eggs", "milk"]);
    });

    it("should filter out empty strings", () => {
      const items = ["eggs", "   ", "", "milk"];
      const result = normalizeStringArray(items);

      expect(result).toEqual(["eggs", "milk"]);
    });

    it("should handle empty array", () => {
      const result = normalizeStringArray([]);

      expect(result).toEqual([]);
    });

    it("should preserve order of first occurrence", () => {
      const items = ["banana", "apple", "BANANA", "cherry", "Apple"];
      const result = normalizeStringArray(items);

      expect(result).toEqual(["banana", "apple", "cherry"]);
    });
  });

  describe("hasAtLeastOneField", () => {
    it("should return true when diet_type is set", () => {
      const values: ProfileFormValues = {
        dietType: "vegan",
        dislikedIngredients: [],
        preferredCuisines: [],
      };

      expect(hasAtLeastOneField(values)).toBe(true);
    });

    it("should return true when dislikedIngredients has items", () => {
      const values: ProfileFormValues = {
        dietType: null,
        dislikedIngredients: ["eggs"],
        preferredCuisines: [],
      };

      expect(hasAtLeastOneField(values)).toBe(true);
    });

    it("should return true when preferredCuisines has items", () => {
      const values: ProfileFormValues = {
        dietType: null,
        dislikedIngredients: [],
        preferredCuisines: ["italian"],
      };

      expect(hasAtLeastOneField(values)).toBe(true);
    });

    it("should return true when all fields are set", () => {
      const values: ProfileFormValues = {
        dietType: "vegetarian",
        dislikedIngredients: ["meat"],
        preferredCuisines: ["indian"],
      };

      expect(hasAtLeastOneField(values)).toBe(true);
    });

    it("should return false when all fields are empty", () => {
      const values: ProfileFormValues = {
        dietType: null,
        dislikedIngredients: [],
        preferredCuisines: [],
      };

      expect(hasAtLeastOneField(values)).toBe(false);
    });
  });

  describe("isFormDirty", () => {
    const initialValues: ProfileFormValues = {
      dietType: "vegan",
      dislikedIngredients: ["shellfish", "peanuts"],
      preferredCuisines: ["italian", "japanese"],
    };

    it("should return true when diet_type changed", () => {
      const values: ProfileFormValues = {
        ...initialValues,
        dietType: "vegetarian",
      };

      expect(isFormDirty(values, initialValues)).toBe(true);
    });

    it("should return true when diet_type changed to null", () => {
      const values: ProfileFormValues = {
        ...initialValues,
        dietType: null,
      };

      expect(isFormDirty(values, initialValues)).toBe(true);
    });

    it("should return true when dislikedIngredients changed", () => {
      const values: ProfileFormValues = {
        ...initialValues,
        dislikedIngredients: ["eggs"],
      };

      expect(isFormDirty(values, initialValues)).toBe(true);
    });

    it("should return true when preferredCuisines changed", () => {
      const values: ProfileFormValues = {
        ...initialValues,
        preferredCuisines: ["french"],
      };

      expect(isFormDirty(values, initialValues)).toBe(true);
    });

    it("should return false when arrays have same content in different order", () => {
      const values: ProfileFormValues = {
        dietType: "vegan",
        dislikedIngredients: ["peanuts", "shellfish"], // reversed
        preferredCuisines: ["japanese", "italian"], // reversed
      };

      expect(isFormDirty(values, initialValues)).toBe(false);
    });

    it("should return false when nothing changed", () => {
      const values: ProfileFormValues = {
        dietType: "vegan",
        dislikedIngredients: ["shellfish", "peanuts"],
        preferredCuisines: ["italian", "japanese"],
      };

      expect(isFormDirty(values, initialValues)).toBe(false);
    });

    it("should return true when multiple fields changed", () => {
      const values: ProfileFormValues = {
        dietType: "keto",
        dislikedIngredients: [],
        preferredCuisines: ["american"],
      };

      expect(isFormDirty(values, initialValues)).toBe(true);
    });
  });
});
