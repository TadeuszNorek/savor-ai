import { useI18n } from "../../lib/contexts/I18nContext";

/**
 * LoginPageFooter Component
 *
 * Displays the translated terms and privacy notice for the login page.
 *
 * @component
 */
export function LoginPageFooter() {
  const { t } = useI18n();

  return (
    <div className="mt-8 text-center text-sm text-muted-foreground">
      <p>{t("auth.termsAndPrivacy")}</p>
    </div>
  );
}
