import { forwardRef, type InputHTMLAttributes } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  variant?: "light" | "dark";
};

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, id, variant = "light", ...rest }, ref) => {
    const fieldId = id ?? rest.name;
    const isDark = variant === "dark";

    return (
      <div>
        <label
          htmlFor={fieldId}
          className={`mb-1 block text-sm font-medium ${
            isDark ? "text-cream-light/85" : "text-ink-soft"
          }`}
        >
          {label}
        </label>
        <input
          ref={ref}
          id={fieldId}
          className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none transition ${
            isDark
              ? "border-none bg-white text-ink focus:ring-2 focus:ring-white/40"
              : `border bg-white text-ink focus:border-teal focus:ring-2 focus:ring-teal/20 ${
                  error ? "border-coral" : "border-border"
                }`
          }`}
          {...rest}
        />
        {error && (
          <p
            className={`mt-1 text-xs ${isDark ? "text-[#ffd7cd]" : "text-coral"}`}
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

TextField.displayName = "TextField";

export default TextField;
