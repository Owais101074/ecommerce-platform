import { Minus, Plus } from 'lucide-react';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  max: number;
  min?: number;
  disabled?: boolean;
  size?: 'sm' | 'md';
  label?: string;
}

export function QuantityStepper({
  value,
  onChange,
  max,
  min = 1,
  disabled = false,
  size = 'sm',
  label = 'Quantity',
}: QuantityStepperProps) {
  const canDecrease = !disabled && value > min;
  const canIncrease = !disabled && value < max;
  const buttonSize = size === 'md' ? 'h-10 w-10' : 'h-8 w-8';
  const valueWidth = size === 'md' ? 'w-10 text-sm' : 'w-8 text-xs';

  return (
    <div
      className="inline-flex items-center rounded-full border border-ink-200 bg-paper shadow-sm"
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={!canDecrease}
        aria-label={`Decrease ${label.toLowerCase()}`}
        className={`${buttonSize} flex items-center justify-center rounded-full text-ink-600 transition hover:bg-ink-50 hover:text-ink-900 disabled:pointer-events-none disabled:opacity-35`}
      >
        <Minus className={size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'} aria-hidden="true" />
      </button>
      <span
        aria-live="polite"
        className={`${valueWidth} text-center font-semibold text-ink-900 tabular-nums`}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={!canIncrease}
        aria-label={`Increase ${label.toLowerCase()}`}
        className={`${buttonSize} flex items-center justify-center rounded-full text-ink-600 transition hover:bg-ink-50 hover:text-ink-900 disabled:pointer-events-none disabled:opacity-35`}
      >
        <Plus className={size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'} aria-hidden="true" />
      </button>
    </div>
  );
}
