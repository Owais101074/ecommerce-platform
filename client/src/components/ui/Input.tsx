import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  trailing?: ReactNode;
}

export function Input({ label, error, hint, trailing, className = '', id, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = `${inputId}-description`;

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-[13px] font-semibold text-ink-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? descriptionId : undefined}
          className={`h-12 w-full rounded-xl border bg-paper px-4 text-sm text-ink-900 shadow-[0_1px_0_rgb(28_23_18/0.03)] transition placeholder:text-ink-400 focus:ring-4 focus:outline-none ${
            trailing ? 'pr-12' : ''
          } ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
              : 'border-ink-200 focus:border-brand-500 focus:ring-brand-500/12'
          } ${className}`}
          {...props}
        />
        {trailing && <div className="absolute inset-y-0 right-2 flex items-center">{trailing}</div>}
      </div>
      {error ? (
        <p id={descriptionId} className="flex items-start gap-1.5 text-[13px] text-red-600">
          <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p id={descriptionId} className="text-[13px] text-ink-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
