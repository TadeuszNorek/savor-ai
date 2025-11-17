import { useI18n } from "../../lib/contexts/I18nContext";

/**
 * ResetPasswordPageHeader Component
 *
 * Displays the translated header for the reset password page.
 *
 * @component
 */
export function ResetPasswordPageHeader() {
  const { t } = useI18n();

  return (
    <div className="text-center mb-8">
      <h1 className="text-4xl font-bold mb-2">
        {t("auth.resetPasswordPageTitle")}
      </h1>
      <p className="text-muted-foreground">
        {t("auth.resetPasswordPageSubtitle")}
      </p>
    </div>
  );
}
