import { getErrorMessage } from '@/api/errors';
import { Container } from '@/components/layout/Container';
import { Alert } from '@/components/ui/Alert';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAdminPing } from '@/hooks/useAdminPing';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export function AdminPage() {
  useDocumentTitle('Admin');
  const ping = useAdminPing();

  return (
    <Container className="py-10 sm:py-14">
      <p className="text-xs font-semibold tracking-widest text-brand-600 uppercase">Admin</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink-900">Admin area</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-500">
        This route is protected twice: the client guard checks your role before rendering, and the
        API rejects any non-admin token with 403.
      </p>

      <div className="mt-8 max-w-2xl">
        {ping.isPending && <Skeleton className="h-32" />}

        {ping.isError && (
          <ErrorState
            title="Admin check failed"
            message={getErrorMessage(ping.error)}
            onRetry={() => void ping.refetch()}
          />
        )}

        {ping.data && (
          <Alert variant="success" title={ping.data}>
            <p>
              The server confirmed your admin role on{' '}
              <span className="font-mono text-xs">GET /admin/ping</span>. Management screens arrive
              in a later phase.
            </p>
          </Alert>
        )}
      </div>
    </Container>
  );
}
