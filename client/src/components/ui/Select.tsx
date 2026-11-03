import { useId, type SelectHTMLAttributes } from 'react';
import { ChevronDown, CircleAlert } from 'lucide-react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function Select({
  label,
  error,
  hint,
  className = '',
  id,
  children,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const descriptionId = `${selectId}-description`;

  return (
    <div className="space-y-2">
      <label htmlFor={selectId} className="block text-[13px] font-semibold text-ink-700">
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? descriptionId : undefined}
          className={`h-11 w-full appearance-none rounded-xl border bg-paper px-3.5 pr-10 text-sm text-ink-900 transition focus:ring-4 focus:outline-none ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
              : 'border-ink-200 focus:border-brand-500 focus:ring-brand-500/12'
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-ink-400"
          aria-hidden="true"
        />
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
