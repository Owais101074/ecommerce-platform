import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, ShieldCheck, Sparkles } from 'lucide-react';
import { BrandMark } from '@/components/ui/BrandMark';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

const points = [
  'Access tokens stay in memory, never in storage',
  'Refresh tokens rotate on every renewal',
  'One account for your profile and future orders',
];

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-dvh bg-cream lg:grid lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-brand-900 p-12 text-cream lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="dot-grid-light absolute inset-0 opacity-40" aria-hidden="true" />
        <div
          className="absolute -left-24 top-1/3 h-96 w-96 rounded-full border border-cream/10"
          aria-hidden="true"
        />
        <div
          className="absolute -left-10 top-[42%] h-64 w-64 rounded-full border border-cream/10"
          aria-hidden="true"
        />
        <div
          className="absolute -right-16 -bottom-16 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative">
          <BrandMark inverted />
        </div>

        <div className="relative max-w-md">
          <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-accent-300 uppercase">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            The Bazaar edit
          </p>
          <h2 className="mt-5 font-display text-4xl leading-[1.05] font-semibold xl:text-5xl">
            Considered goods for <span className="text-accent-200 italic">everyday living.</span>
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-cream/60">
            A small storefront built on a typed API, exact pricing and sessions that are safe by
            default.
          </p>

          <ul className="mt-8 space-y-3">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm text-cream/75">
                <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-cream/10">
                  <Check className="h-3 w-3" aria-hidden="true" />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative flex items-center gap-2 text-xs text-cream/40">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          httpOnly refresh cookies · rotated every session
        </p>
      </aside>

      <div className="flex min-h-dvh flex-col">
        <div className="flex items-center justify-between px-5 py-6 sm:px-8 lg:justify-end">
          <div className="lg:hidden">
            <BrandMark />
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition hover:text-ink-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to store
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-12 sm:px-8">
          <div className="animate-rise w-full max-w-md">
            <h1 className="font-display text-4xl font-semibold tracking-tight text-ink-900">
              {title}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">{subtitle}</p>

            <div className="mt-8">{children}</div>

            <div className="mt-8 text-center text-sm text-ink-500">{footer}</div>
          </div>
        </div>

        <p className="pb-6 text-center text-[11px] tracking-wide text-ink-400">
          © {new Date().getFullYear()} Bazaar · Built phase by phase
        </p>
      </div>
    </div>
  );
}
