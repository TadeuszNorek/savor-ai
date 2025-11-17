import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_VvUFyhd8.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../../chunks/Layout_CGm0sF21.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useRef } from 'react';
import { C as Card, a as CardHeader, b as CardTitle, c as CardDescription, d as CardContent, A as Alert, e as AlertDescription, B as Button, v as validateEmail, n as normalizeEmail } from '../../chunks/validation_DuP_19Dc.mjs';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { E as EmailInput } from '../../chunks/EmailInput_CbXxUIR-.mjs';
import { s as supabaseClient } from '../../chunks/supabase.client_Dmi2Rupz.mjs';
export { renderers } from '../../renderers.mjs';

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState();
  const [formError, setFormError] = useState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [touched, setTouched] = useState(false);
  const emailRef = useRef(null);
  const handleEmailChange = (value) => {
    setEmail(value);
    if (touched) {
      setEmailError(void 0);
    }
  };
  const handleEmailBlur = () => {
    setTouched(true);
    const error = validateEmail(email);
    setEmailError(error);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    const error = validateEmail(email);
    setEmailError(error);
    if (error) {
      emailRef.current?.focus();
      return;
    }
    setIsSubmitting(true);
    setFormError(void 0);
    const normalizedEmail = normalizeEmail(email);
    try {
      const { error: error2 } = await supabaseClient.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/auth/reset`
      });
      if (error2) {
        console.error("Password reset error:", error2);
        setFormError("Failed to send reset email. Please try again.");
        setIsSubmitting(false);
        return;
      }
      setIsSuccess(true);
    } catch (error2) {
      console.error("Unexpected error:", error2);
      setFormError("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };
  if (isSuccess) {
    return /* @__PURE__ */ jsxs(Card, { className: "w-full max-w-md mx-auto", children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsx(CardTitle, { children: "Check your email" }),
        /* @__PURE__ */ jsx(CardDescription, { children: "If an account exists with this email, you will receive password reset instructions." })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { children: [
        /* @__PURE__ */ jsxs(Alert, { children: [
          /* @__PURE__ */ jsx(CheckCircle, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsxs(AlertDescription, { children: [
            "We've sent password reset instructions to ",
            /* @__PURE__ */ jsx("strong", { children: email }),
            ". Please check your inbox and spam folder."
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-6 text-center", children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", asChild: true, children: /* @__PURE__ */ jsx("a", { href: "/login", children: "Back to Sign In" }) }) })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs(Card, { className: "w-full max-w-md mx-auto", children: [
    /* @__PURE__ */ jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsx(CardTitle, { children: "Forgot your password?" }),
      /* @__PURE__ */ jsx(CardDescription, { children: "Enter your email address and we'll send you instructions to reset your password." })
    ] }),
    /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", "aria-label": "Forgot password form", children: [
      formError && /* @__PURE__ */ jsxs(Alert, { variant: "destructive", children: [
        /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4" }),
        /* @__PURE__ */ jsx(AlertDescription, { children: formError })
      ] }),
      /* @__PURE__ */ jsx(
        EmailInput,
        {
          ref: emailRef,
          value: email,
          onChange: handleEmailChange,
          onBlur: handleEmailBlur,
          error: touched ? emailError : void 0,
          disabled: isSubmitting
        }
      ),
      /* @__PURE__ */ jsx(
        Button,
        {
          type: "submit",
          className: "w-full",
          disabled: isSubmitting || !!emailError,
          "aria-label": "Send reset instructions",
          children: isSubmitting ? "Sending..." : "Send Reset Instructions"
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

const $$Forgot = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Forgot Password - SavorAI", "showHeader": false }, { "default": ($$result2) => renderTemplate`  ${renderComponent($$result2, "LoginThemeToggle", null, { "client:only": "react", "client:component-hydration": "only", "client:component-path": "D:/projects/savor-ai/src/components/LoginThemeToggle", "client:component-export": "LoginThemeToggle" })} ${maybeRenderHead()}<main class="container mx-auto px-4 py-16 min-h-screen flex items-center justify-center"> <div class="w-full max-w-md"> <div class="text-center mb-8"> <h1 class="text-4xl font-bold mb-2">Password Recovery</h1> <p class="text-muted-foreground">We'll help you get back into your account</p> </div> ${renderComponent($$result2, "ForgotPasswordForm", ForgotPasswordForm, { "client:load": true, "client:component-hydration": "load", "client:component-path": "D:/projects/savor-ai/src/components/auth/ForgotPasswordForm", "client:component-export": "ForgotPasswordForm" })} </div> </main> ` })}`;
}, "D:/projects/savor-ai/src/pages/auth/forgot.astro", void 0);

const $$file = "D:/projects/savor-ai/src/pages/auth/forgot.astro";
const $$url = "/auth/forgot";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Forgot,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
