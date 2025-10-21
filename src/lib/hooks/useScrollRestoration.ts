import { useEffect, useRef } from "react";

/**
 * Custom hook for saving and restoring scroll position
 * Uses sessionStorage to persist scroll position across navigation
 *
 * @param key - Unique key for this scroll position (e.g., URL search params)
 * @returns Ref to attach to scrollable element
 */
export function useScrollRestoration<T extends HTMLElement = HTMLDivElement>(key: string) {
  const elementRef = useRef<T>(null);
  const storageKey = `scroll-${key}`;

  // Restore scroll position on mount
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Restore saved position
    const savedPosition = sessionStorage.getItem(storageKey);
    if (savedPosition) {
      const position = parseInt(savedPosition, 10);
      if (!isNaN(position)) {
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
          element.scrollTop = position;
        }, 0);
      }
    }
  }, [storageKey]);

  // Save scroll position when scrolling
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      // Debounce to avoid too many writes
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        sessionStorage.setItem(storageKey, element.scrollTop.toString());
      }, 100);
    };

    element.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      element.removeEventListener("scroll", handleScroll);
    };
  }, [storageKey]);

  return elementRef;
}
