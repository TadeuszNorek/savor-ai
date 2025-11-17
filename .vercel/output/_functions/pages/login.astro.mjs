import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_VvUFyhd8.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_CGm0sF21.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useRef } from 'react';
import { h as hasErrors, C as Card, a as CardHeader, b as CardTitle, c as CardDescription, d as CardContent, A as Alert, e as AlertDescription, B as Button, g as validateAuthForm, n as normalizeEmail } from '../chunks/validation_DuP_19Dc.mjs';
import { AlertCircle } from 'lucide-react';
import { E as EmailInput } from '../chunks/EmailInput_CbXxUIR-.mjs';
import { P as PasswordInput } from '../chunks/PasswordInput_B4gFNqVN.mjs';
import { s as supabaseClient } from '../chunks/supabase.client_Dmi2Rupz.mjs';
export { renderers } from '../renderers.mjs';

async function sendSessionStartEvent() {
  try {
    const {
      data: { session },
      error: sessionError
    } = await supabaseClient.auth.getSession();
    if (sessionError || !session?.access_token) {
      console.debug("Cannot send session_start event: No valid session");
      return;
    }
    const response = await fetch("/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        type: "session_start"
      })
    });
    if (!response.ok) {
      console.debug(`session_start event failed: ${response.status} ${response.statusText}`);
    } else {
      console.debug("session_start event sent successfully");
    }
  } catch (error) {
    console.debug("Failed to send session_start event:", error);
  }
}

function AuthForm({ initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode);
  const [values, setValues] = useState({
    email: "",
    password: ""
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({
    email: false,
    password: false
  });
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const handleEmailChange = (email) => {
    setValues((prev) => ({ ...prev, email }));
    if (touched.email) {
      setErrors((prev) => ({ ...prev, email: void 0 }));
    }
  };
  const handlePasswordChange = (password) => {
    setValues((prev) => ({ ...prev, password }));
    if (touched.password) {
      setErrors((prev) => ({ ...prev, password: void 0 }));
    }
  };
  const handleEmailBlur = () => {
    setTouched((prev) => ({ ...prev, email: true }));
    const emailError = validateAuthForm({ ...values }).email;
    setErrors((prev) => ({ ...prev, email: emailError }));
  };
  const handlePasswordBlur = () => {
    setTouched((prev) => ({ ...prev, password: true }));
    const passwordError = validateAuthForm({ ...values }).password;
    setErrors((prev) => ({ ...prev, password: passwordError }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("[AuthForm] Submit started, mode:", mode);
    setTouched({ email: true, password: true });
    const validationErrors = validateAuthForm(values);
    setErrors(validationErrors);
    console.log("[AuthForm] Validation errors:", validationErrors);
    if (hasErrors(validationErrors)) {
      console.log("[AuthForm] Validation failed, stopping");
      if (validationErrors.email) {
        emailRef.current?.focus();
      } else if (validationErrors.password) {
        passwordRef.current?.focus();
      }
      return;
    }
    setIsSubmitting(true);
    console.log("[AuthForm] Starting auth request...");
    const normalizedEmail = normalizeEmail(values.email);
    console.log("[AuthForm] Normalized email:", normalizedEmail);
    try {
      if (mode === "login") {
        console.log("[AuthForm] Calling signInWithPassword...");
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: normalizedEmail,
          password: values.password
        });
        console.log("[AuthForm] signInWithPassword response:", { data: !!data, error: error?.message });
        if (error) {
          let message = "Login failed";
          if (error.message.includes("Invalid login credentials")) {
            message = "Invalid email or password";
          } else if (error.message.includes("Email not confirmed")) {
            message = "Please verify your email address";
          } else if (error.message.includes("rate")) {
            message = "Too many attempts. Please try again later";
          }
          console.log("[AuthForm] Login error:", message);
          setErrors({ form: message });
          return;
        }
        console.log("[AuthForm] Login successful, waiting for session...");
        await new Promise((resolve) => setTimeout(resolve, 100));
        const { data: sessionData } = await supabaseClient.auth.getSession();
        console.log("[AuthForm] Session check:", { hasSession: !!sessionData.session });
        if (!sessionData.session) {
          console.log("[AuthForm] Session not available!");
          setErrors({ form: "Session error. Please try again." });
          return;
        }
        console.log("[AuthForm] Sending telemetry...");
        sendSessionStartEvent().catch(() => {
        });
        console.log("[AuthForm] Redirecting to /app");
        window.location.href = "/app";
      } else {
        const { error } = await supabaseClient.auth.signUp({
          email: normalizedEmail,
          password: values.password
        });
        if (error) {
          setErrors({ form: error.message || "Registration failed" });
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
        const { data: sessionData } = await supabaseClient.auth.getSession();
        if (!sessionData.session) {
          setErrors({ form: "Session error. Please try again." });
          return;
        }
        sendSessionStartEvent().catch(() => {
        });
        window.location.href = "/app";
      }
    } catch (error) {
      console.error("[AuthForm] Caught error:", error);
      setErrors({
        form: "Network error. Please check your connection and try again."
      });
    } finally {
      console.log("[AuthForm] Submit finished");
      setIsSubmitting(false);
    }
  };
  const handleModeSwitch = () => {
    setMode((prev) => prev === "login" ? "register" : "login");
    setErrors({});
  };
  const isLogin = mode === "login";
  const isValid = !hasErrors(errors);
  return /* @__PURE__ */ jsxs(Card, { className: "w-full max-w-md mx-auto", children: [
    /* @__PURE__ */ jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsx(CardTitle, { children: isLogin ? "Sign In" : "Create Account" }),
      /* @__PURE__ */ jsx(CardDescription, { children: isLogin ? "Enter your email and password to sign in" : "Enter your email and password to create an account" })
    ] }),
    /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", "aria-label": `${isLogin ? "Login" : "Registration"} form`, children: [
      errors.form && /* @__PURE__ */ jsxs(Alert, { variant: errors.form.includes("ready") ? "default" : "destructive", children: [
        /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4" }),
        /* @__PURE__ */ jsx(AlertDescription, { children: errors.form })
      ] }),
      /* @__PURE__ */ jsx(
        EmailInput,
        {
          ref: emailRef,
          value: values.email,
          onChange: handleEmailChange,
          onBlur: handleEmailBlur,
          error: touched.email ? errors.email : void 0,
          disabled: isSubmitting
        }
      ),
      /* @__PURE__ */ jsx(
        PasswordInput,
        {
          ref: passwordRef,
          value: values.password,
          onChange: handlePasswordChange,
          onBlur: handlePasswordBlur,
          error: touched.password ? errors.password : void 0,
          disabled: isSubmitting,
          label: isLogin ? "Password" : "Password (min. 8 characters)"
        }
      ),
      /* @__PURE__ */ jsx(
        Button,
        {
          type: "submit",
          className: "w-full",
          disabled: isSubmitting || !isValid,
          "aria-label": isLogin ? "Sign in" : "Create account",
          children: isSubmitting ? "Processing..." : isLogin ? "Sign In" : "Create Account"
        }
      ),
      isLogin && /* @__PURE__ */ jsx("div", { className: "text-center text-sm", children: /* @__PURE__ */ jsx("a", { href: "/auth/forgot", className: "text-muted-foreground hover:text-primary hover:underline", children: "Forgot your password?" }) }),
      /* @__PURE__ */ jsx("div", { className: "text-center text-sm", children: isLogin ? /* @__PURE__ */ jsxs("p", { children: [
        "Don't have an account?",
        " ",
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: handleModeSwitch,
            className: "text-primary hover:underline font-medium",
            disabled: isSubmitting,
            children: "Sign up"
          }
        )
      ] }) : /* @__PURE__ */ jsxs("p", { children: [
        "Already have an account?",
        " ",
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: handleModeSwitch,
            className: "text-primary hover:underline font-medium",
            disabled: isSubmitting,
            children: "Sign in"
          }
        )
      ] }) })
    ] }) })
  ] });
}

const $$Login = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Sign In - SavorAI", "showHeader": false }, { "default": ($$result2) => renderTemplate`  ${renderComponent($$result2, "LoginThemeToggle", null, { "client:only": "react", "client:component-hydration": "only", "client:component-path": "D:/projects/savor-ai/src/components/LoginThemeToggle", "client:component-export": "LoginThemeToggle" })} ${maybeRenderHead()}<main class="container mx-auto px-4 py-16 min-h-screen flex items-center justify-center"> <div class="w-full max-w-md"> <div class="text-center mb-6"> <img src="/favicon.svg" alt="SavorAI Logo" class="mx-auto h-20 w-20 mb-4"> <h1 class="text-3xl font-bold mb-2">Welcome to SavorAI</h1> <p class="text-muted-foreground">Your AI-powered recipe companion</p> </div> ${renderComponent($$result2, "AuthForm", AuthForm, { "client:load": true, "client:component-hydration": "load", "client:component-path": "D:/projects/savor-ai/src/components/auth/AuthForm", "client:component-export": "AuthForm" })} <div class="mt-8 text-center text-sm text-muted-foreground"> <p>By signing in, you agree to our Terms of Service and Privacy Policy.</p> </div> </div> </main> ` })}`;
}, "D:/projects/savor-ai/src/pages/login.astro", void 0);

const $$file = "D:/projects/savor-ai/src/pages/login.astro";
const $$url = "/login";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Login,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
