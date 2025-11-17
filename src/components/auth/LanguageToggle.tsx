import { useI18n } from "../../lib/contexts/I18nContext";
import type { LanguageCode } from "../../lib/i18n/types";

/**
 * LanguageToggle Component
 *
 * Simple language toggle button for auth pages.
 * Positioned in the top-right corner.
 *
 * @component
 */
export function LanguageToggle() {
  const { lang, setLang } = useI18n();

  const handleToggle = () => {
    const newLang: LanguageCode = lang === "pl" ? "en" : "pl";
    setLang(newLang);
  };

  return (
    <button
      onClick={handleToggle}
      className="fixed top-4 right-20 z-50 px-3 py-1.5 text-sm font-medium rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
      aria-label={lang === "pl" ? "Switch to English" : "Przełącz na polski"}
    >
      {lang === "pl" ? "EN" : "PL"}
    </button>
  );
}
