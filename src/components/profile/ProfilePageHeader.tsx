import { useI18n } from "../../lib/contexts/I18nContext";

/**
 * ProfilePageHeader Component
 *
 * Displays the translated page title and description for the profile page.
 *
 * @component
 */
export function ProfilePageHeader() {
  const { t } = useI18n();

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-2">{t('profile.pageTitle')}</h1>
      <p className="text-muted-foreground">
        {t('profile.pageDescription')}
      </p>
    </div>
  );
}
