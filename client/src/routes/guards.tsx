import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageLoader } from '@/components/ui/PageLoader';
import { useAuth } from '@/features/auth/useAuth';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <PageLoader label="Checking your session…" />;
  }

  if (status === 'guest') {
    return (
      <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
    );
  }

  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { status, isAdmin } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <PageLoader label="Checking your permissions…" />;
  }

  if (status === 'guest') {
    return (
      <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
    );
  }

  if (!isAdmin) {
    return (
      <Container className="py-16">
        <ErrorState
          title="Admins only"
          message="Your account does not have permission to view this page."
        />
      </Container>
    );
  }

  return <>{children}</>;
}
