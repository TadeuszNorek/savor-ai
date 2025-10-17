/**
 * Cursor Pagination Utilities
 * Encodes and decodes cursor tokens for keyset pagination
 */

/**
 * Cursor format: "created_at:id"
 * Encoded as Base64 for safe URL transmission
 */
export interface CursorData {
  createdAt: string; // ISO 8601 timestamp
  id: string; // UUID
}

/**
 * Encode cursor data to Base64 string
 * @param createdAt - ISO 8601 timestamp
 * @param id - Recipe UUID
 * @returns Base64 encoded cursor
 */
export function encodeCursor(createdAt: string, id: string): string {
  const cursorString = `${createdAt}:${id}`;
  return Buffer.from(cursorString, "utf-8").toString("base64");
}

/**
 * Decode Base64 cursor to structured data
 * @param cursor - Base64 encoded cursor string
 * @returns Decoded cursor data
 * @throws Error if cursor format is invalid
 */
export function decodeCursor(cursor: string): CursorData {
  try {
    // Decode Base64
    const decoded = Buffer.from(cursor, "base64").toString("utf-8");

    // Split by colon
    const parts = decoded.split(":");
    if (parts.length !== 2) {
      throw new Error("Invalid cursor format: expected 'created_at:id'");
    }

    const [createdAt, id] = parts;

    // Validate ISO 8601 format (basic check)
    const dateTest = new Date(createdAt);
    if (isNaN(dateTest.getTime())) {
      throw new Error("Invalid cursor: created_at is not a valid ISO 8601 date");
    }

    // Validate UUID format (basic check)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(id)) {
      throw new Error("Invalid cursor: id is not a valid UUID");
    }

    return { createdAt, id };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid cursor")) {
      throw error;
    }
    throw new Error("Invalid cursor: malformed Base64 encoding");
  }
}

/**
 * Validate cursor string without throwing
 * @param cursor - Base64 cursor to validate
 * @returns true if valid, false otherwise
 */
export function isValidCursor(cursor: string): boolean {
  try {
    decodeCursor(cursor);
    return true;
  } catch {
    return false;
  }
}
