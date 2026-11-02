import { Link } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { buttonStyles } from '@/components/ui/button-styles';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export function NotFoundPage() {
  useDocumentTitle('Page not found');

  return (
    <Container className="py-24 text-center">
      <p className="text-sm font-bold tracking-widest text-brand-600 uppercase">404</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink-900">Page not found</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
        The page you are looking for does not exist or has moved somewhere else.
      </p>
      <Link to="/" className={`mt-6 ${buttonStyles()}`}>
        Back to home
      </Link>
    </Container>
  );
}
