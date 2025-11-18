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

  // Load language from user profile on login (only once globally across all I18nProvider instances)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!authToken) {
      // Clear the flag when logged out
      sessionStorage.removeItem("i18n_profile_loaded");
      return;
    }

    // Check if ANY I18nProvider instance already loaded the profile this session
    const alreadyLoaded = sessionStorage.getItem("i18n_profile_loaded");
    if (alreadyLoaded) {
      console.log("⚠ Profile language already loaded by another I18nProvider instance");
      return;
    }

    const loadLanguageFromProfile = async () => {
      try {
        // Mark as loading to prevent other instances from loading simultaneously
        sessionStorage.setItem("i18n_profile_loading", "true");

        const response = await fetch("/api/profile", {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (response.ok) {
          const profile = await response.json();
          if (profile.preferred_language && isLanguageCode(profile.preferred_language)) {
            // Check if localStorage was recently updated (last 30 seconds)
            // If so, user just changed language - don't override with profile
            const lastUpdate = localStorage.getItem("preferred_language_updated");
            const now = Date.now();
            if (lastUpdate && now - parseInt(lastUpdate) < 30000) {
              console.log("⚠ Skipping profile language load - localStorage recently updated");
              sessionStorage.setItem("i18n_profile_loaded", "true");
              sessionStorage.removeItem("i18n_profile_loading");
              return;
            }

            // Get current language from localStorage (not from state to avoid stale closure)
            const currentLang = localStorage.getItem("preferred_language");

            // Only update if different from current language
            if (profile.preferred_language !== currentLang) {
              setLangState(profile.preferred_language);
              localStorage.setItem("preferred_language", profile.preferred_language);
              window.dispatchEvent(
                new CustomEvent("languagechange", { detail: profile.preferred_language })
              );
              console.log("✓ Loaded language preference from profile:", profile.preferred_language);
            }
          }
        }
        // Mark as loaded so other instances won't try to load again
        sessionStorage.setItem("i18n_profile_loaded", "true");
        sessionStorage.removeItem("i18n_profile_loading");
      } catch (error) {
        console.warn("⚠ Failed to load language preference from profile:", error);
        sessionStorage.setItem("i18n_profile_loaded", "true");
        sessionStorage.removeItem("i18n_profile_loading");
        // Graceful degradation - continue with localStorage language
      }
    };

    loadLanguageFromProfile();
  }, [authToken]); // Only authToken in dependencies

  // Update <html lang> attribute for accessibility
  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  // Listen for language changes from other I18nProvider instances (storage event)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "preferred_language" && e.newValue && isLanguageCode(e.newValue)) {
        setLangState(e.newValue);
      }
    };

    // Listen for storage events from other tabs/windows
    window.addEventListener("storage", handleStorageChange);

    // Also listen for custom events from same tab (different I18nProvider instances)
    const handleCustomLanguageChange = (e: Event) => {
      const customEvent = e as CustomEvent<LanguageCode>;
      setLangState((currentLang) => {
        // Only update if different to avoid infinite loops
        if (customEvent.detail !== currentLang) {
          return customEvent.detail;
        }
        return currentLang;
      });
    };

    window.addEventListener("languagechange", handleCustomLanguageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("languagechange", handleCustomLanguageChange);
    };
  }, []); // No dependencies - event listener doesn't need to be re-attached

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

      // Notify other I18nProvider instances in the same tab
      window.dispatchEvent(new CustomEvent("languagechange", { detail: newLang }));

      // 2. Background sync to backend (if authenticated)
      if (authToken) {
        // Set timestamp BEFORE calling API to prevent race condition
        localStorage.setItem("preferred_language_updated", Date.now().toString());

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
            // Refresh timestamp after successful sync
            localStorage.setItem("preferred_language_updated", Date.now().toString());
          }
        } catch (error) {
          console.warn("⚠ Network error syncing language preference:", error);
          // Don't throw - graceful degradation
          // User can still use the app with localStorage
        }
      } else {
        // Not authenticated - set timestamp for pre-login language choice
        localStorage.setItem("preferred_language_updated", Date.now().toString());
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
