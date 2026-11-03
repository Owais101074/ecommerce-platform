import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';
import { RotateCcw, TriangleAlert } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { buttonStyles } from '@/components/ui/button-styles';

export function RouteErrorPage() {
  const error = useRouteError();

  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'An unexpected error interrupted this page.';

  return (
    <Container className="py-24 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100">
        <TriangleAlert className="h-7 w-7" aria-hidden="true" />
      </div>
      <p className="mt-6 text-[11px] font-bold tracking-[0.2em] text-red-600 uppercase">
        Something broke
      </p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink-900">
        This page could not be rendered.
      </h1>
      <pre className="mx-auto mt-4 max-w-md overflow-auto rounded-xl border border-ink-200 bg-paper px-4 py-3 text-left text-xs whitespace-pre-wrap text-ink-600">
        <code>{message}</code>
      </pre>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link to="/" className={buttonStyles()}>
          Back to home
        </Link>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reload page
        </Button>
      </div>
    </Container>
  );
}
