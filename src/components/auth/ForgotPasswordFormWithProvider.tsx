import { I18nProvider } from "../../lib/contexts/I18nContext";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { ForgotPasswordPageHeader } from "./ForgotPasswordPageHeader";
import { AuthPageControls } from "./AuthPageControls";
import { PageTitle } from "../PageTitle";

/**
 * ForgotPasswordFormWithProvider Component
 *
 * Wraps ForgotPasswordForm with I18nProvider and includes header to ensure proper context availability.
 * Used in forgot password page to avoid hydration issues.
 *
 * @component
 */
export function ForgotPasswordFormWithProvider() {
  return (
    <I18nProvider>
      <PageTitle titleKey="pageTitles.forgotPassword" />
      <AuthPageControls />
      <ForgotPasswordPageHeader />
      <ForgotPasswordForm />
    </I18nProvider>
  );
}
