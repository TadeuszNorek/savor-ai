import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useScrollRestoration } from "@/lib/hooks/useScrollRestoration";

describe("useScrollRestoration hook", () => {
  let mockSessionStorage: Record<string, string>;

  beforeEach(() => {
    mockSessionStorage = {};
    global.sessionStorage = {
      getItem: vi.fn((key: string) => mockSessionStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockSessionStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockSessionStorage[key];
      }),
      clear: vi.fn(() => {
        mockSessionStorage = {};
      }),
      length: 0,
      key: vi.fn(),
    } as Storage;
  });

  it("should return a ref object", () => {
    const { result } = renderHook(() => useScrollRestoration("test-key"));

    expect(result.current).toBeDefined();
    expect(result.current).toHaveProperty("current", null);
  });

  it("should create consistent ref across rerenders", () => {
    const { result, rerender } = renderHook(() => useScrollRestoration("test-key"));

    const firstRef = result.current;
    rerender();
    const secondRef = result.current;

    expect(firstRef).toBe(secondRef);
  });

  it("should use different refs for different keys", () => {
    const { result: result1 } = renderHook(() => useScrollRestoration("key1"));
    const { result: result2 } = renderHook(() => useScrollRestoration("key2"));

    // Each hook instance should have its own ref
    expect(result1.current).not.toBe(result2.current);
  });

  it("should not throw when sessionStorage has no saved value", () => {
    expect(() => {
      renderHook(() => useScrollRestoration("new-key"));
    }).not.toThrow();
  });

  it("should not throw when sessionStorage has invalid value", () => {
    mockSessionStorage["scroll-test"] = "invalid-number";

    expect(() => {
      renderHook(() => useScrollRestoration("test"));
    }).not.toThrow();
  });

  it("should not throw when sessionStorage returns null", () => {
    expect(() => {
      renderHook(() => useScrollRestoration("null-key"));
    }).not.toThrow();
  });

  it("should handle unmount without errors", () => {
    const { unmount } = renderHook(() => useScrollRestoration("test-key"));

    expect(() => {
      unmount();
    }).not.toThrow();
  });
});
