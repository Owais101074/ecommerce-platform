import { useId, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className = '', id, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = `${inputId}-description`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-ink-700">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? descriptionId : undefined}
        className={`h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-ink-900 shadow-sm transition placeholder:text-ink-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 focus:outline-none ${
          error ? 'border-red-400' : 'border-ink-200'
        } ${className}`}
        {...props}
      />
      {error ? (
        <p id={descriptionId} className="text-sm text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={descriptionId} className="text-sm text-ink-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
