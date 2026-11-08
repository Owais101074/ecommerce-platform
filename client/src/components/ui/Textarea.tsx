import { useId, type TextareaHTMLAttributes } from 'react';
import { CircleAlert } from 'lucide-react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, className = '', id, ...props }: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const descriptionId = `${textareaId}-description`;

  return (
    <div className="space-y-2">
      <label htmlFor={textareaId} className="block text-[13px] font-semibold text-ink-700">
        {label}
      </label>
      <textarea
        id={textareaId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? descriptionId : undefined}
        className={`w-full rounded-xl border bg-paper px-4 py-3 text-sm leading-relaxed text-ink-900 shadow-[0_1px_0_rgb(28_23_18/0.03)] transition placeholder:text-ink-400 focus:ring-4 focus:outline-none ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
            : 'border-ink-200 focus:border-brand-500 focus:ring-brand-500/12'
        } ${className}`}
        {...props}
      />
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
