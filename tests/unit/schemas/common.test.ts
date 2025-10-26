import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { UuidSchema, validateUuid } from '@/lib/schemas/common.schema';

describe('common schemas', () => {
  describe('UuidSchema', () => {
    it('should validate valid UUID v4', () => {
      const validUuids = [
        '123e4567-e89b-12d3-a456-426614174000',
        'a1b2c3d4-e5f6-4789-a012-bcdef1234567',
        '550e8400-e29b-41d4-a716-446655440000',
      ];

      validUuids.forEach(uuid => {
        const result = UuidSchema.safeParse(uuid);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(uuid);
        }
      });
    });

    it('should accept UUID with uppercase letters', () => {
      const uuid = 'A1B2C3D4-E5F6-4789-A012-BCDEF1234567';
      const result = UuidSchema.safeParse(uuid);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID format', () => {
      const invalidUuids = [
        'not-a-uuid',
        '123-456-789',
        '123e4567-e89b-12d3-a456',  // Too short
        '123e4567-e89b-12d3-a456-426614174000-extra',  // Too long
        '123e4567e89b12d3a456426614174000',  // No dashes
        'gggggggg-gggg-gggg-gggg-gggggggggggg',  // Invalid hex chars
      ];

      invalidUuids.forEach(uuid => {
        const result = UuidSchema.safeParse(uuid);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Invalid UUID format');
        }
      });
    });

    it('should reject non-string values', () => {
      const invalidValues = [
        123,
        null,
        undefined,
        {},
        [],
        true,
      ];

      invalidValues.forEach(value => {
        const result = UuidSchema.safeParse(value);
        expect(result.success).toBe(false);
      });
    });

    it('should reject empty string', () => {
      const result = UuidSchema.safeParse('');
      expect(result.success).toBe(false);
    });
  });

  describe('validateUuid', () => {
    it('should return valid UUID', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const result = validateUuid(uuid);
      expect(result).toBe(uuid);
    });

    it('should throw ZodError for invalid UUID', () => {
      expect(() => validateUuid('not-a-uuid')).toThrow(z.ZodError);
    });

    it('should throw ZodError for non-string value', () => {
      expect(() => validateUuid(123)).toThrow(z.ZodError);
      expect(() => validateUuid(null)).toThrow(z.ZodError);
      expect(() => validateUuid(undefined)).toThrow(z.ZodError);
    });

    it('should throw ZodError with correct message', () => {
      try {
        validateUuid('invalid-uuid');
        expect.fail('Should have thrown ZodError');
      } catch (error) {
        expect(error).toBeInstanceOf(z.ZodError);
        if (error instanceof z.ZodError) {
          expect(error.issues[0].message).toBe('Invalid UUID format');
        }
      }
    });

    it('should accept uppercase UUID', () => {
      const uuid = 'A1B2C3D4-E5F6-4789-A012-BCDEF1234567';
      const result = validateUuid(uuid);
      expect(result).toBe(uuid);
    });
  });
});
