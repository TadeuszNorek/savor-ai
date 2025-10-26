import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  CreateProfileCommandSchema,
  UpdateProfileCommandSchema,
  type CreateProfileCommandInput,
  type UpdateProfileCommandInput,
} from '@/lib/schemas/profile.schema';

describe('profile schemas', () => {
  describe('CreateProfileCommandSchema', () => {
    it('should validate empty profile (all fields optional)', () => {
      const emptyProfile = {};
      const result = CreateProfileCommandSchema.safeParse(emptyProfile);
      expect(result.success).toBe(true);
    });

    it('should validate profile with all fields', () => {
      const fullProfile = {
        diet_type: 'vegan',
        disliked_ingredients: ['shellfish', 'peanuts'],
        preferred_cuisines: ['italian', 'japanese'],
      };
      const result = CreateProfileCommandSchema.safeParse(fullProfile);
      expect(result.success).toBe(true);
    });

    it('should validate all diet type values', () => {
      const dietTypes = [
        'vegan',
        'vegetarian',
        'pescatarian',
        'keto',
        'paleo',
        'gluten_free',
        'dairy_free',
        'low_carb',
        'mediterranean',
        'omnivore',
      ];

      dietTypes.forEach(dietType => {
        const profile = { diet_type: dietType };
        const result = CreateProfileCommandSchema.safeParse(profile);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid diet type', () => {
      const invalidProfile = { diet_type: 'invalid_diet' };
      const result = CreateProfileCommandSchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
    });

    it('should normalize disliked ingredients (lowercase, trim, dedup)', () => {
      const profile = {
        disliked_ingredients: ['  Shellfish  ', 'PEANUTS', 'shellfish', '  peanuts  '],
      };
      const result = CreateProfileCommandSchema.safeParse(profile);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.disliked_ingredients).toEqual(['shellfish', 'peanuts']);
      }
    });

    it('should reject array with empty strings before transformation', () => {
      // Schema validates min(1) before transform, so empty strings are rejected
      const profile = {
        disliked_ingredients: ['shellfish', '', 'peanuts'],
      };
      const result = CreateProfileCommandSchema.safeParse(profile);
      expect(result.success).toBe(false);
    });

    it('should reject disliked ingredient exceeding 50 characters', () => {
      const profile = {
        disliked_ingredients: ['a'.repeat(51)],
      };
      const result = CreateProfileCommandSchema.safeParse(profile);
      expect(result.success).toBe(false);
    });

    it('should reject disliked ingredients array exceeding 100 items', () => {
      const profile = {
        disliked_ingredients: Array(101).fill('ingredient'),
      };
      const result = CreateProfileCommandSchema.safeParse(profile);
      expect(result.success).toBe(false);
    });

    it('should normalize preferred cuisines', () => {
      const profile = {
        preferred_cuisines: ['  ITALIAN  ', 'Japanese', 'italian', 'JAPANESE'],
      };
      const result = CreateProfileCommandSchema.safeParse(profile);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.preferred_cuisines).toEqual(['italian', 'japanese']);
      }
    });

    it('should reject extra fields in strict mode', () => {
      const profileWithExtra = {
        diet_type: 'vegan',
        extra_field: 'not allowed',
      };
      const result = CreateProfileCommandSchema.safeParse(profileWithExtra);
      expect(result.success).toBe(false);
    });

    it('should handle profile with only diet_type', () => {
      const profile = { diet_type: 'vegetarian' };
      const result = CreateProfileCommandSchema.safeParse(profile);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.diet_type).toBe('vegetarian');
        expect(result.data.disliked_ingredients).toBeUndefined();
        expect(result.data.preferred_cuisines).toBeUndefined();
      }
    });
  });

  describe('UpdateProfileCommandSchema', () => {
    it('should validate update with all fields', () => {
      const update = {
        diet_type: 'keto',
        disliked_ingredients: ['gluten'],
        preferred_cuisines: ['mediterranean'],
      };
      const result = UpdateProfileCommandSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it('should validate update with single field', () => {
      const update = { diet_type: 'paleo' };
      const result = UpdateProfileCommandSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it('should allow setting diet_type to null', () => {
      const update = { diet_type: null };
      const result = UpdateProfileCommandSchema.safeParse(update);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.diet_type).toBeNull();
      }
    });

    it('should reject empty update (no fields provided)', () => {
      const emptyUpdate = {};
      const result = UpdateProfileCommandSchema.safeParse(emptyUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('At least one field must be provided for update');
      }
    });

    it('should reject update with only undefined values', () => {
      const update = {
        diet_type: undefined,
        disliked_ingredients: undefined,
        preferred_cuisines: undefined,
      };
      const result = UpdateProfileCommandSchema.safeParse(update);
      expect(result.success).toBe(false);
    });

    it('should normalize arrays in update command', () => {
      const update = {
        disliked_ingredients: ['  EGGS  ', 'milk', 'EGGS'],
      };
      const result = UpdateProfileCommandSchema.safeParse(update);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.disliked_ingredients).toEqual(['eggs', 'milk']);
      }
    });

    it('should reject extra fields in strict mode', () => {
      const updateWithExtra = {
        diet_type: 'vegan',
        unknown_field: 'value',
      };
      const result = UpdateProfileCommandSchema.safeParse(updateWithExtra);
      expect(result.success).toBe(false);
    });

    it('should validate update with only disliked_ingredients', () => {
      const update = {
        disliked_ingredients: ['seafood', 'nuts'],
      };
      const result = UpdateProfileCommandSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it('should validate update with only preferred_cuisines', () => {
      const update = {
        preferred_cuisines: ['french', 'thai'],
      };
      const result = UpdateProfileCommandSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it('should handle complex update scenario', () => {
      const update = {
        diet_type: null, // Clear diet type
        disliked_ingredients: ['SOY', '  wheat  ', 'soy'], // Normalize & dedup
        preferred_cuisines: ['mexican'],
      };
      const result = UpdateProfileCommandSchema.safeParse(update);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.diet_type).toBeNull();
        expect(result.data.disliked_ingredients).toEqual(['soy', 'wheat']);
        expect(result.data.preferred_cuisines).toEqual(['mexican']);
      }
    });
  });
});
