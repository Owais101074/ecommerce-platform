import { Link } from 'react-router-dom';
import { ArrowRight, Compass } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { buttonStyles } from '@/components/ui/button-styles';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export function NotFoundPage() {
  useDocumentTitle('Page not found');

  return (
    <Container className="relative py-20 sm:py-28">
      <div className="dot-grid absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="relative mx-auto max-w-xl text-center">
        <div className="relative mx-auto flex h-44 w-44 items-end justify-center">
          <span
            className="absolute inset-0 rounded-t-full rounded-b-3xl border border-ink-300/70"
            aria-hidden="true"
          />
          <span
            className="absolute inset-4 rounded-t-full rounded-b-2xl bg-brand-50"
            aria-hidden="true"
          />
          <span
            className="absolute inset-8 rounded-t-full rounded-b-xl bg-brand-100/60"
            aria-hidden="true"
          />
          <span className="relative pb-5 font-display text-6xl font-semibold text-brand-900">
            404
          </span>
          <span
            className="absolute top-6 right-2 h-5 w-5 rounded-full bg-accent-400"
            aria-hidden="true"
          />
        </div>

        <p className="mt-8 text-[11px] font-bold tracking-[0.2em] text-accent-600 uppercase">
          Page not found
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink-900">
          This shelf is empty.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-500">
          The page you are looking for does not exist or has moved somewhere else.
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link to="/" className={buttonStyles()}>
            Back to the store
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link to="/#new-arrivals" className={buttonStyles({ variant: 'secondary' })}>
            <Compass className="h-4 w-4" aria-hidden="true" />
            Browse new arrivals
          </Link>
        </div>
      </div>
    </Container>
  );
}
