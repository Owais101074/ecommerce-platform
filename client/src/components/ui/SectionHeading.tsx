import type { ReactNode } from 'react';

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function SectionHeading({ eyebrow, title, description, action }: SectionHeadingProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div className="max-w-2xl">
        <p className="flex items-center gap-2.5 text-[11px] font-bold tracking-[0.2em] text-accent-600 uppercase">
          <span className="h-px w-6 bg-accent-400" aria-hidden="true" />
          {eyebrow}
        </p>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
          {title}
        </h2>
        {description && <p className="mt-3 text-sm leading-relaxed text-ink-500">{description}</p>}
      </div>
      {action && <div className="pb-1 text-sm text-ink-500">{action}</div>}
    </div>
  );
}
