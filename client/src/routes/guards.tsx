import type { ReactNode } from 'react';
import { Navigate, useLocation, type Location } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageLoader } from '@/components/ui/PageLoader';
import { useAuth } from '@/features/auth/useAuth';

interface GuardState {
  notice?: string;
}

/** Keeps the intended destination and any sign-out notice when a guard sends the user to login. */
function loginRedirectState(location: Location) {
  const notice = (location.state as GuardState | null)?.notice;

  return {
    from: `${location.pathname}${location.search}`,
    ...(notice ? { notice } : {}),
  };
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <PageLoader label="Checking your session…" />;
  }

  if (status === 'guest') {
    return <Navigate to="/login" replace state={loginRedirectState(location)} />;
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
    return <Navigate to="/login" replace state={loginRedirectState(location)} />;
  }

  if (!isAdmin) {
    return (
      <Container className="py-20">
        <div className="mx-auto max-w-xl">
          <ErrorState
            title="Admins only"
            message="Your account does not have permission to view this page."
          />
        </div>
      </Container>
    );
  }

  return <>{children}</>;
}
