import { useI18n } from "../../lib/contexts/I18nContext";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";

/**
 * LanguageSwitcher Component
 *
 * Toggle between Polish (PL) and English (EN) languages.
 * Similar UX to dark mode toggle - instant feedback with auto-save.
 *
 * Features:
 * - Auto-saves to localStorage (instant)
 * - Syncs to backend profile (async, in background)
 * - Shows loading indicator during sync
 * - Accessible with proper ARIA labels
 *
 * @component
 */
export function LanguageSwitcher() {
  const { lang, setLang, isLoading } = useI18n();

  const handleLanguageChange = async (newLang: "pl" | "en") => {
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
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-1" aria-label="Syncing language..." />
      )}
    </div>
  );
}
