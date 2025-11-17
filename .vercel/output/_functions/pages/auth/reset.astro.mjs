import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_VvUFyhd8.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../../chunks/Layout_CEGH4ugq.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useRef, useEffect } from 'react';
import { C as Card, a as CardHeader, b as CardTitle, c as CardDescription, d as CardContent, A as Alert, e as AlertDescription, B as Button, f as validatePassword } from '../../chunks/validation_DuP_19Dc.mjs';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { P as PasswordInput } from '../../chunks/PasswordInput_B4gFNqVN.mjs';
import { s as supabaseClient } from '../../chunks/supabase.client_Dmi2Rupz.mjs';
export { renderers } from '../../renderers.mjs';

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState();
  const [formError, setFormError] = useState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isRecoverySession, setIsRecoverySession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [touched, setTouched] = useState(false);
  const passwordRef = useRef(null);
  useEffect(() => {
    const checkRecoverySession = async () => {
      try {
        const {
          data: { session }
        } = await supabaseClient.auth.getSession();
        if (session) {
          setIsRecoverySession(true);
        } else {
          setFormError("Invalid or expired password reset link.");
        }
      } catch (error) {
        console.error("Failed to check recovery session:", error);
        setFormError("Failed to verify reset link. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    checkRecoverySession();
    const {
      data: { subscription }
    } = supabaseClient.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecoverySession(true);
        setIsLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);
  const handlePasswordChange = (value) => {
    setPassword(value);
    if (touched) {
      setPasswordError(void 0);
    }
  };
  const handlePasswordBlur = () => {
    setTouched(true);
    const error = validatePassword(password);
    setPasswordError(error);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    const error = validatePassword(password);
    setPasswordError(error);
    if (error) {
      passwordRef.current?.focus();
      return;
    }
    setIsSubmitting(true);
    setFormError(void 0);
    try {
      const { error: error2 } = await supabaseClient.auth.updateUser({ password });
      if (error2) {
        console.error("Password update error:", error2);
        setFormError("Failed to update password. Please try again.");
        setIsSubmitting(false);
        return;
      }
      setIsSuccess(true);
      setTimeout(() => {
        window.location.href = "/login";
      }, 3e3);
    } catch (error2) {
      console.error("Unexpected error:", error2);
      setFormError("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };
  if (isLoading) {
    return /* @__PURE__ */ jsxs(Card, { className: "w-full max-w-md mx-auto", children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsx(CardTitle, { children: "Reset your password" }),
        /* @__PURE__ */ jsx(CardDescription, { children: "Verifying reset link..." })
      ] }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center py-8", children: /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: "Loading..." }) }) })
    ] });
  }
  if (isSuccess) {
    return /* @__PURE__ */ jsxs(Card, { className: "w-full max-w-md mx-auto", children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsx(CardTitle, { children: "Password updated!" }),
        /* @__PURE__ */ jsx(CardDescription, { children: "Your password has been successfully reset." })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { children: [
        /* @__PURE__ */ jsxs(Alert, { children: [
          /* @__PURE__ */ jsx(CheckCircle, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx(AlertDescription, { children: "You can now sign in with your new password. Redirecting to login page..." })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-6 text-center", children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", asChild: true, children: /* @__PURE__ */ jsx("a", { href: "/login", children: "Go to Sign In" }) }) })
      ] })
    ] });
  }
  if (!isRecoverySession) {
    return /* @__PURE__ */ jsxs(Card, { className: "w-full max-w-md mx-auto", children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsx(CardTitle, { children: "Reset link expired" }),
        /* @__PURE__ */ jsx(CardDescription, { children: "This password reset link is invalid or has expired." })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { children: [
        /* @__PURE__ */ jsxs(Alert, { variant: "destructive", children: [
          /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx(AlertDescription, { children: formError || "Invalid reset link." })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-6 text-center", children: /* @__PURE__ */ jsx(Button, { variant: "default", asChild: true, children: /* @__PURE__ */ jsx("a", { href: "/auth/forgot", children: "Request New Reset Link" }) }) })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs(Card, { className: "w-full max-w-md mx-auto", children: [
    /* @__PURE__ */ jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsx(CardTitle, { children: "Set new password" }),
      /* @__PURE__ */ jsx(CardDescription, { children: "Enter a new password for your account. Make sure it's at least 8 characters long." })
    ] }),
    /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", "aria-label": "Reset password form", children: [
      formError && /* @__PURE__ */ jsxs(Alert, { variant: "destructive", children: [
        /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4" }),
        /* @__PURE__ */ jsx(AlertDescription, { children: formError })
      ] }),
      /* @__PURE__ */ jsx(
        PasswordInput,
        {
          ref: passwordRef,
          value: password,
          onChange: handlePasswordChange,
          onBlur: handlePasswordBlur,
          error: touched ? passwordError : void 0,
          disabled: isSubmitting,
          label: "New Password (min. 8 characters)"
        }
      ),
      /* @__PURE__ */ jsx(
        Button,
        {
          type: "submit",
          className: "w-full",
          disabled: isSubmitting || !!passwordError,
          "aria-label": "Update password",
          children: isSubmitting ? "Updating..." : "Update Password"
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "text-center text-sm", children: /* @__PURE__ */ jsxs("p", { children: [
        "Remember your password?",
        " ",
        /* @__PURE__ */ jsx("a", { href: "/login", className: "text-primary hover:underline font-medium", children: "Sign in" })
      ] }) })
    ] }) })
  ] });
}

const $$Reset = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Reset Password - SavorAI", "showHeader": false }, { "default": ($$result2) => renderTemplate`  ${renderComponent($$result2, "LoginThemeToggle", null, { "client:only": "react", "client:component-hydration": "only", "client:component-path": "D:/projects/savor-ai/src/components/LoginThemeToggle", "client:component-export": "LoginThemeToggle" })} ${maybeRenderHead()}<main class="container mx-auto px-4 py-16 min-h-screen flex items-center justify-center"> <div class="w-full max-w-md"> <div class="text-center mb-8"> <h1 class="text-4xl font-bold mb-2">Reset Your Password</h1> <p class="text-muted-foreground">Choose a new password for your account</p> </div> ${renderComponent($$result2, "ResetPasswordForm", ResetPasswordForm, { "client:load": true, "client:component-hydration": "load", "client:component-path": "D:/projects/savor-ai/src/components/auth/ResetPasswordForm", "client:component-export": "ResetPasswordForm" })} </div> </main> ` })}`;
}, "D:/projects/savor-ai/src/pages/auth/reset.astro", void 0);

const $$file = "D:/projects/savor-ai/src/pages/auth/reset.astro";
const $$url = "/auth/reset";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Reset,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
