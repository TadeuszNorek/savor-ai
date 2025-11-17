import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { LanguageCode } from "../../types";
import { isLanguageCode, DEFAULT_LANGUAGE } from "../../types";
import { translations, getTranslation } from "../i18n/translations";

interface I18nContextType {
  lang: LanguageCode;
  setLang: (lang: LanguageCode) => Promise<void>;
  isLoading: boolean;
  /**
   * Translate a key to the current language
   * @param key - Dot-separated path to translation (e.g., 'generator.title')
   * @param replacements - Optional key-value pairs for placeholder replacement
   * @example
   * t('generator.title') // => 'AI Recipe Generator' or 'Generator Przepisów AI'
   * t('recipePreview.ingredientsProgress', { count: 3, total: 10 }) // => '3 of 10'
   */
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
  /**
   * Optional auth token for syncing language preference to backend
   * If not provided, only localStorage will be used
   */
  authToken?: string | null;
}

/**
 * I18nProvider Component
 *
 * Manages language preference with auto-save functionality.
 * Similar to dark mode toggle - instant UI update with background sync.
 *
 * Features:
 * - Auto-detects browser language on first visit
 * - Persists user choice to localStorage (instant)
 * - Syncs to backend profile (async, non-blocking)
 * - Graceful degradation if backend sync fails
 * - Updates <html lang> attribute for accessibility
 *
 * Language precedence (on mount):
 * 1. localStorage (user's previous choice)
 * 2. navigator.language (browser setting)
 * 3. DEFAULT_LANGUAGE ('en')
 *
 * @component
 */
export function I18nProvider({ children, authToken }: I18nProviderProps) {
  const [lang, setLangState] = useState<LanguageCode>(() => {
    // 1. Try localStorage (user's previous choice)
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("preferred_language");
      if (stored && isLanguageCode(stored)) {
        return stored;
      }

      // 2. Try navigator.language (browser setting)
      const browserLang = navigator.language.split("-")[0]; // 'pl-PL' -> 'pl'
      if (isLanguageCode(browserLang)) {
        return browserLang;
      }
    }

    // 3. Default to English
    return DEFAULT_LANGUAGE;
  });

  const [isLoading, setIsLoading] = useState(false);

  // Update <html lang> attribute for accessibility
  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  /**
   * Set language with auto-save
   * 1. Instant UI update (localStorage)
   * 2. Background sync to backend (non-blocking)
   */
  const setLang = useCallback(
    async (newLang: LanguageCode) => {
      if (newLang === lang) return; // No-op if same language

      setIsLoading(true);

      // 1. Instant update to localStorage and state
      setLangState(newLang);
      localStorage.setItem("preferred_language", newLang);

      // 2. Background sync to backend (if authenticated)
      if (authToken) {
        try {
          const response = await fetch("/api/profile", {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              preferred_language: newLang,
            }),
          });

          if (!response.ok) {
            console.warn("⚠ Failed to sync language preference to backend (localStorage still works)");
            // Don't throw - graceful degradation
          } else {
            console.log("✓ Language preference synced to profile");
          }
        } catch (error) {
          console.warn("⚠ Network error syncing language preference:", error);
          // Don't throw - graceful degradation
          // User can still use the app with localStorage
        }
      }

      setIsLoading(false);
    },
    [lang, authToken]
  );

  /**
   * Translation function - gets translation for current language
   */
  const t = useCallback(
    (key: string, replacements?: Record<string, string | number>): string => {
      return getTranslation(translations[lang], key, replacements);
    },
    [lang]
  );

  return <I18nContext.Provider value={{ lang, setLang, isLoading, t }}>{children}</I18nContext.Provider>;
}

/**
 * useI18n Hook
 *
 * Access i18n context in any component.
 * Must be used within I18nProvider.
 *
 * @example
 * ```tsx
 * const { lang, setLang, isLoading } = useI18n();
 *
 * // Switch language (auto-saves to localStorage + backend)
 * await setLang('pl');
 * ```
 */
export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
