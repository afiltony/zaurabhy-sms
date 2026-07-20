import { forwardRef, type SelectHTMLAttributes } from "react";

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  options: readonly string[];
  placeholder?: string;
};

const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, id, options, placeholder = "Select...", ...rest }, ref) => {
    const fieldId = id ?? rest.name;

    return (
      <div>
        <label htmlFor={fieldId} className="mb-1 block text-sm font-medium text-ink-soft">
          {label}
        </label>
        <select
          ref={ref}
          id={fieldId}
          defaultValue=""
          className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20 ${
            error ? "border-coral" : "border-border"
          }`}
          {...rest}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-coral">{error}</p>}
      </div>
    );
  },
);

SelectField.displayName = "SelectField";

export default SelectField;
