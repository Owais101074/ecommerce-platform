import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
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
      <p className="text-sm font-bold tracking-widest text-red-600 uppercase">Something broke</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink-900">
        This page could not be rendered
      </h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">{message}</p>
      <Link to="/" className={`mt-6 ${buttonStyles()}`}>
        Back to home
      </Link>
    </Container>
  );
}
