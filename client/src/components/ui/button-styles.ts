export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-800 text-cream shadow-[0_12px_30px_-18px_rgb(18_53_39/0.9)] hover:bg-brand-900 hover:shadow-[0_18px_40px_-20px_rgb(18_53_39/0.8)] active:translate-y-px',
  secondary:
    'border border-ink-300/80 bg-paper text-ink-800 hover:border-ink-400 hover:bg-ink-50 active:translate-y-px',
  ghost: 'text-ink-700 hover:bg-ink-900/5',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700 active:translate-y-px',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-6 text-sm',
  lg: 'h-12 px-7 text-[15px]',
};

/** Shared button styling so React Router links look like buttons without nesting a <button>. */
export function buttonStyles({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
}: ButtonStyleOptions = {}): string {
  return `inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''}`;
}
