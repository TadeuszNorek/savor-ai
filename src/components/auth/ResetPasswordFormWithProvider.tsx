import { I18nProvider } from "../../lib/contexts/I18nContext";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { ResetPasswordPageHeader } from "./ResetPasswordPageHeader";
import { LanguageToggle } from "./LanguageToggle";

/**
 * ResetPasswordFormWithProvider Component
 *
 * Wraps ResetPasswordForm with I18nProvider and includes header to ensure proper context availability.
 * Used in reset password page to avoid hydration issues.
 *
 * @component
 */
export function ResetPasswordFormWithProvider() {
  return (
    <I18nProvider>
      <LanguageToggle />
      <ResetPasswordPageHeader />
      <ResetPasswordForm />
    </I18nProvider>
  );
}
