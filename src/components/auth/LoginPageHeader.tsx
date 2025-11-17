import { useI18n } from "../../lib/contexts/I18nContext";

/**
 * LoginPageHeader Component
 *
 * Displays the translated header for the login page.
 *
 * @component
 */
export function LoginPageHeader() {
  const { t } = useI18n();

  return (
    <div className="text-center mb-6">
      <img
        src="/favicon.svg"
        alt="SavorAI Logo"
        className="mx-auto h-20 w-20 mb-4"
      />
      <h1 className="text-3xl font-bold mb-2">{t("auth.welcomeTitle")}</h1>
      <p className="text-muted-foreground">{t("auth.welcomeSubtitle")}</p>
    </div>
  );
}
