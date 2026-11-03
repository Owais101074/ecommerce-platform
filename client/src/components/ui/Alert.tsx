import type { ReactNode } from 'react';
import { CircleAlert, CircleCheck, Info } from 'lucide-react';

type AlertVariant = 'error' | 'success' | 'info';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
}

const styles = {
  error: {
    wrapper: 'border-red-200 bg-red-50/80 text-red-900',
    icon: 'text-red-600',
    Icon: CircleAlert,
  },
  success: {
    wrapper: 'border-brand-200 bg-brand-50/80 text-brand-900',
    icon: 'text-brand-600',
    Icon: CircleCheck,
  },
  info: {
    wrapper: 'border-ink-200 bg-paper text-ink-800',
    icon: 'text-ink-500',
    Icon: Info,
  },
} as const;

export function Alert({ variant = 'error', title, children }: AlertProps) {
  const { wrapper, icon, Icon } = styles[variant];

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${wrapper}`}
    >
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${icon}`} aria-hidden="true" />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        <div className={title ? 'mt-0.5' : ''}>{children}</div>
      </div>
    </div>
  );
}
