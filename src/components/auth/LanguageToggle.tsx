import { useI18n } from "../../lib/contexts/I18nContext";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import type { LanguageCode } from "../../lib/i18n/types";

/**
 * LanguageToggle Component
 *
 * Language switcher for auth pages.
 * Identical UI to LanguageSwitcher for consistency.
 * Positioned in the top-right corner.
 *
 * @component
 */
export function LanguageToggle() {
  const { lang, setLang, isLoading } = useI18n();

  const handleLanguageChange = async (newLang: LanguageCode) => {
    if (newLang === lang) return;
    await setLang(newLang);
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant={lang === "pl" ? "default" : "ghost"}
        size="sm"
        onClick={() => handleLanguageChange("pl")}
        disabled={isLoading}
        aria-label="Switch to Polish"
        className="min-w-[42px] px-2"
      >
        PL
      </Button>
      <Button
        variant={lang === "en" ? "default" : "ghost"}
        size="sm"
        onClick={() => handleLanguageChange("en")}
        disabled={isLoading}
        aria-label="Switch to English"
        className="min-w-[42px] px-2"
      >
        EN
      </Button>
      {isLoading && (
        <Loader2
          className="h-3 w-3 animate-spin text-muted-foreground ml-1"
          aria-label="Syncing language..."
        />
      )}
    </div>
  );
}
