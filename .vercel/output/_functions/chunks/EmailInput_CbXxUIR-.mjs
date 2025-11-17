import { jsxs, jsx } from 'react/jsx-runtime';
import { forwardRef } from 'react';
import { L as Label, I as Input } from './validation_DuP_19Dc.mjs';

const EmailInput = forwardRef(
  ({ value, onChange, error, disabled, onBlur }, ref) => {
    const hasError = !!error;
    return /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { htmlFor: "email", children: "Email" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          ref,
          id: "email",
          type: "email",
          autoComplete: "email",
          value,
          onChange: (e) => onChange(e.target.value),
          onBlur,
          disabled,
          "aria-invalid": hasError,
          "aria-describedby": hasError ? "email-error" : void 0,
          className: hasError ? "border-destructive" : ""
        }
      ),
      hasError && /* @__PURE__ */ jsx("p", { id: "email-error", className: "text-sm text-destructive", role: "alert", children: error })
    ] });
  }
);
EmailInput.displayName = "EmailInput";

export { EmailInput as E };
