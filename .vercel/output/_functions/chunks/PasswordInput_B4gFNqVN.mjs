import { jsxs, jsx } from 'react/jsx-runtime';
import { forwardRef, useState } from 'react';
import { L as Label, I as Input, B as Button } from './validation_DuP_19Dc.mjs';
import { EyeOff, Eye } from 'lucide-react';

const PasswordInput = forwardRef(
  ({ value, onChange, error, disabled, onBlur, label = "Password" }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const hasError = !!error;
    const toggleShowPassword = () => {
      setShowPassword((prev) => !prev);
    };
    return /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { htmlFor: "password", children: label }),
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(
          Input,
          {
            ref,
            id: "password",
            type: showPassword ? "text" : "password",
            autoComplete: "current-password",
            value,
            onChange: (e) => onChange(e.target.value),
            onBlur,
            disabled,
            "aria-invalid": hasError,
            "aria-describedby": hasError ? "password-error" : void 0,
            className: `pr-10 ${hasError ? "border-destructive" : ""}`
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "button",
            variant: "ghost",
            size: "sm",
            className: "absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent",
            onClick: toggleShowPassword,
            disabled,
            "aria-label": showPassword ? "Hide password" : "Show password",
            children: showPassword ? /* @__PURE__ */ jsx(EyeOff, { className: "h-4 w-4 text-muted-foreground", "aria-hidden": "true" }) : /* @__PURE__ */ jsx(Eye, { className: "h-4 w-4 text-muted-foreground", "aria-hidden": "true" })
          }
        )
      ] }),
      hasError && /* @__PURE__ */ jsx("p", { id: "password-error", className: "text-sm text-destructive", role: "alert", children: error })
    ] });
  }
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput as P };
