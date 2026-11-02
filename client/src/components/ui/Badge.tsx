import type { ReactNode } from 'react';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand';

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-ink-100 text-ink-700',
  success: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-accent-100 text-accent-600',
  danger: 'bg-red-100 text-red-700',
  brand: 'bg-brand-100 text-brand-800',
};

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
