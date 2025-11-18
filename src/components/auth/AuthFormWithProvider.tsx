import { I18nProvider } from "../../lib/contexts/I18nContext";
import { AuthForm } from "./AuthForm";
import { LoginPageHeader } from "./LoginPageHeader";
import { LoginPageFooter } from "./LoginPageFooter";
import { AuthPageControls } from "./AuthPageControls";
import { PageTitle } from "../PageTitle";
import type { AuthFormMode } from "../../lib/auth/types";

interface AuthFormWithProviderProps {
  initialMode?: AuthFormMode;
}

/**
 * AuthFormWithProvider Component
 *
 * Wraps AuthForm with I18nProvider and includes header/footer to ensure proper context availability.
 * Used in login page to avoid hydration issues with separate client:only directives.
 *
 * @component
 */
export function AuthFormWithProvider({
  initialMode = "login",
}: AuthFormWithProviderProps) {
  return (
    <I18nProvider>
      <PageTitle titleKey="pageTitles.login" />
      <AuthPageControls />
      <LoginPageHeader />
      <AuthForm initialMode={initialMode} />
      <LoginPageFooter />
    </I18nProvider>
  );
}
