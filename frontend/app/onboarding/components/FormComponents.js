// Reusable form components for onboarding forms

export function FormLabel({ children, required = false }) {
  return (
    <label className="mb-2 block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
      {children} {required && <span className="text-red-600">⭐</span>}
    </label>
  );
}

export function FormSelect({ label, value, onChange, options, placeholder, required = false, helperText }) {
  return (
    <div>
      {label && <FormLabel required={required}>{label}</FormLabel>}
      <select
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border-2 border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 transition focus:border-purple-600 focus:outline-none focus:bg-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => {
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;
          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
      {helperText && (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{helperText}</p>
      )}
    </div>
  );
}

export function FormInput({ label, value, onChange, placeholder, required = false, helperText, type = "text" }) {
  return (
    <div>
      {label && <FormLabel required={required}>{label}</FormLabel>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-lg border-2 border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 transition focus:border-purple-600 focus:outline-none focus:bg-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />
      {helperText && (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{helperText}</p>
      )}
    </div>
  );
}

export function FormCheckboxGroup({ label, options, selectedValues = [], onChange, required = false }) {
  const handleCheckboxChange = (value) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onChange(newValues);
  };

  return (
    <div>
      {label && <FormLabel required={required}>{label}</FormLabel>}
      <div className="space-y-3">
        {options.map((option) => {
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;
          return (
            <label
              key={optionValue}
              className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-zinc-200 bg-zinc-50 px-4 py-3 transition hover:border-purple-400 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <input
                type="checkbox"
                checked={selectedValues.includes(optionValue)}
                onChange={() => handleCheckboxChange(optionValue)}
                className="h-4 w-4 rounded border-zinc-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-zinc-900 dark:text-zinc-100">
                {optionLabel}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export function FormRadioGroup({ label, options, selectedValue, onChange, required = false }) {
  return (
    <div>
      {label && <FormLabel required={required}>{label}</FormLabel>}
      <div className="space-y-3">
        {options.map((option) => {
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;
          return (
            <label
              key={optionValue}
              className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-zinc-200 bg-zinc-50 px-4 py-3 transition hover:border-purple-400 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <input
                type="radio"
                checked={selectedValue === optionValue}
                onChange={() => onChange(optionValue)}
                className="h-4 w-4 border-zinc-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-zinc-900 dark:text-zinc-100">
                {optionLabel}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
