import { describe, it, expect } from "vitest";
import { encodeCursor, decodeCursor, isValidCursor, type CursorData } from "@/lib/utils/cursor";

describe("cursor pagination utilities", () => {
  // Test data
  const validTimestamp = "2024-01-15T10:30:00.000Z";
  const validUuid = "123e4567-e89b-12d3-a456-426614174000";
  const validCursor = "MjAyNC0wMS0xNVQxMDozMDowMC4wMDBaOjEyM2U0NTY3LWU4OWItMTJkMy1hNDU2LTQyNjYxNDE3NDAwMA==";

  describe("encodeCursor", () => {
    it("should encode valid timestamp and UUID to Base64", () => {
      const result = encodeCursor(validTimestamp, validUuid);
      expect(result).toBe(validCursor);
    });

    it("should encode different timestamps correctly", () => {
      const timestamp = "2023-12-25T00:00:00.000Z";
      const result = encodeCursor(timestamp, validUuid);
      const decoded = Buffer.from(result, "base64").toString("utf-8");
      expect(decoded).toBe(`${timestamp}:${validUuid}`);
    });

    it("should encode different UUIDs correctly", () => {
      const uuid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
      const result = encodeCursor(validTimestamp, uuid);
      const decoded = Buffer.from(result, "base64").toString("utf-8");
      expect(decoded).toBe(`${validTimestamp}:${uuid}`);
    });

    it("should produce URL-safe Base64 string", () => {
      const result = encodeCursor(validTimestamp, validUuid);
      // Base64 should only contain alphanumeric, +, /, and =
      expect(result).toMatch(/^[A-Za-z0-9+/=]+$/);
    });
  });

  describe("decodeCursor", () => {
    it("should decode valid cursor to CursorData", () => {
      const result = decodeCursor(validCursor);
      expect(result).toEqual({
        createdAt: validTimestamp,
        id: validUuid,
      });
    });

    it("should decode cursor with different timestamp", () => {
      const timestamp = "2023-06-01T15:45:30.123Z";
      const encoded = encodeCursor(timestamp, validUuid);
      const result = decodeCursor(encoded);
      expect(result.createdAt).toBe(timestamp);
      expect(result.id).toBe(validUuid);
    });

    it("should decode cursor with different UUID", () => {
      const uuid = "9f8e7d6c-5b4a-3c2d-1e0f-9a8b7c6d5e4f";
      const encoded = encodeCursor(validTimestamp, uuid);
      const result = decodeCursor(encoded);
      expect(result.createdAt).toBe(validTimestamp);
      expect(result.id).toBe(uuid);
    });

    it("should throw error for malformed Base64", () => {
      const invalidBase64 = "not-valid-base64!!!";
      // Base64 decoding may succeed but validation will fail
      expect(() => decodeCursor(invalidBase64)).toThrow(/Invalid cursor/);
    });

    it("should throw error for cursor without colon separator", () => {
      const nocolon = Buffer.from("no-colon-here", "utf-8").toString("base64");
      expect(() => decodeCursor(nocolon)).toThrow("Invalid cursor format: expected 'created_at:id'");
    });

    it("should throw error for cursor with invalid format after extra colons", () => {
      const tooManyParts = Buffer.from("2024-01-15T10:30:00.000Z:uuid:extra", "utf-8").toString("base64");
      // Will split at last colon, validation will fail (either date or UUID)
      expect(() => decodeCursor(tooManyParts)).toThrow(/Invalid cursor/);
    });

    it("should throw error for invalid ISO 8601 date", () => {
      const invalidDate = Buffer.from("invalid-date:123e4567-e89b-12d3-a456-426614174000", "utf-8").toString("base64");
      expect(() => decodeCursor(invalidDate)).toThrow("Invalid cursor: created_at is not a valid ISO 8601 date");
    });

    it("should throw error for invalid UUID format", () => {
      const invalidUuid = Buffer.from("2024-01-15T10:30:00.000Z:not-a-uuid", "utf-8").toString("base64");
      expect(() => decodeCursor(invalidUuid)).toThrow("Invalid cursor: id is not a valid UUID");
    });

    it("should throw error for UUID with incorrect length", () => {
      const shortUuid = Buffer.from("2024-01-15T10:30:00.000Z:123-456", "utf-8").toString("base64");
      expect(() => decodeCursor(shortUuid)).toThrow("Invalid cursor: id is not a valid UUID");
    });

    it("should throw error for UUID with invalid characters", () => {
      const invalidChars = Buffer.from(
        "2024-01-15T10:30:00.000Z:gggggggg-gggg-gggg-gggg-gggggggggggg",
        "utf-8"
      ).toString("base64");
      expect(() => decodeCursor(invalidChars)).toThrow("Invalid cursor: id is not a valid UUID");
    });
  });

  describe("isValidCursor", () => {
    it("should return true for valid cursor", () => {
      expect(isValidCursor(validCursor)).toBe(true);
    });

    it("should return false for malformed Base64", () => {
      expect(isValidCursor("not-valid-base64!!!")).toBe(false);
    });

    it("should return false for cursor without colon", () => {
      const nocolon = Buffer.from("2024-01-15T10:30:00.000Z", "utf-8").toString("base64");
      expect(isValidCursor(nocolon)).toBe(false);
    });

    it("should return false for invalid date", () => {
      const invalidDate = Buffer.from("invalid-date:123e4567-e89b-12d3-a456-426614174000", "utf-8").toString("base64");
      expect(isValidCursor(invalidDate)).toBe(false);
    });

    it("should return false for invalid UUID", () => {
      const invalidUuid = Buffer.from("2024-01-15T10:30:00.000Z:not-a-uuid", "utf-8").toString("base64");
      expect(isValidCursor(invalidUuid)).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(isValidCursor("")).toBe(false);
    });
  });

  describe("round-trip encoding/decoding", () => {
    it("should encode and decode back to original values", () => {
      const encoded = encodeCursor(validTimestamp, validUuid);
      const decoded = decodeCursor(encoded);
      expect(decoded.createdAt).toBe(validTimestamp);
      expect(decoded.id).toBe(validUuid);
    });

    it("should handle multiple round trips", () => {
      const data: CursorData = { createdAt: validTimestamp, id: validUuid };

      const encoded1 = encodeCursor(data.createdAt, data.id);
      const decoded1 = decodeCursor(encoded1);
      expect(decoded1).toEqual(data);

      const encoded2 = encodeCursor(decoded1.createdAt, decoded1.id);
      const decoded2 = decodeCursor(encoded2);
      expect(decoded2).toEqual(data);
    });

    it("should handle edge case dates correctly", () => {
      const testCases = [
        "2000-01-01T00:00:00.000Z", // Y2K
        "2024-02-29T23:59:59.999Z", // Leap year
        "2023-12-31T23:59:59.999Z", // End of year
      ];

      testCases.forEach((timestamp) => {
        const encoded = encodeCursor(timestamp, validUuid);
        const decoded = decodeCursor(encoded);
        expect(decoded.createdAt).toBe(timestamp);
        expect(decoded.id).toBe(validUuid);
      });
    });

    it("should handle various valid UUID formats", () => {
      const testUuids = [
        "00000000-0000-0000-0000-000000000000", // All zeros
        "ffffffff-ffff-ffff-ffff-ffffffffffff", // All f's
        "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", // Lowercase letters
      ];

      testUuids.forEach((uuid) => {
        const encoded = encodeCursor(validTimestamp, uuid);
        const decoded = decodeCursor(encoded);
        expect(decoded.createdAt).toBe(validTimestamp);
        expect(decoded.id).toBe(uuid); // UUID preserved as-is
      });
    });
  });
});
