import { useEffect } from "react";
import { useI18n } from "../lib/contexts/I18nContext";

interface PageTitleProps {
  /**
   * Translation key for the page title
   * e.g., "profile.pageTitle" -> "My Dietary Preferences" / "Moje preferencje dietetyczne"
   */
  titleKey: string;
  /**
   * Suffix to append after the translated title (e.g., " - SavorAI")
   */
  suffix?: string;
}

/**
 * PageTitle Component
 *
 * Updates document.title based on current language.
 * Use this in client-side React components to provide translated page titles.
 *
 * @example
 * ```tsx
 * <PageTitle titleKey="profile.pageTitle" suffix=" - SavorAI" />
 * ```
 *
 * @component
 */
export function PageTitle({ titleKey, suffix = " - SavorAI" }: PageTitleProps) {
  const { t, lang } = useI18n();

  useEffect(() => {
    const title = t(titleKey) + suffix;
    document.title = title;
  }, [titleKey, suffix, lang, t]);

  return null; // This component doesn't render anything
}
