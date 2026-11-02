import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { buttonStyles } from '@/components/ui/button-styles';
import { useAuth } from '@/features/auth/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatDate, initials } from '@/lib/format';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-ink-100 py-3 last:border-0">
      <dt className="text-sm text-ink-500">{label}</dt>
      <dd className="text-right text-sm font-medium break-all text-ink-900">{value}</dd>
    </div>
  );
}

export function AccountPage() {
  useDocumentTitle('Your account');
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  if (!user) {
    return null;
  }

  async function handleSignOut(): Promise<void> {
    setSigningOut(true);
    await logout();
    navigate('/');
  }

  return (
    <Container className="py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-widest text-brand-600 uppercase">Account</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink-900">Your account</h1>
          <p className="mt-1 text-sm text-ink-500">
            Profile details come from the signed-in session served by the API.
          </p>
        </div>

        <div className="flex gap-2">
          {isAdmin && (
            <Link to="/admin" className={buttonStyles({ variant: 'secondary' })}>
              Admin area
            </Link>
          )}
          <Button variant="secondary" onClick={handleSignOut} loading={signingOut}>
            Sign out
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="surface surface-shadow p-6">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-brand-500 to-brand-800 text-xl font-extrabold text-white">
              {initials(user.name)}
            </span>
            <div>
              <h2 className="text-lg font-bold text-ink-900">{user.name}</h2>
              <p className="text-sm text-ink-500">{user.email}</p>
              <div className="mt-2">
                <Badge tone={isAdmin ? 'brand' : 'neutral'}>
                  {isAdmin ? 'Administrator' : 'Customer'}
                </Badge>
              </div>
            </div>
          </div>

          <dl className="mt-6">
            <DetailRow label="Name" value={user.name} />
            <DetailRow label="Email" value={user.email} />
            <DetailRow label="Role" value={user.role} />
            <DetailRow label="Member since" value={formatDate(user.createdAt)} />
            <DetailRow label="User ID" value={user.id} />
          </dl>
        </section>

        <section className="space-y-6">
          <div className="surface surface-shadow p-6">
            <h2 className="text-lg font-bold text-ink-900">How your session works</h2>
            <dl className="mt-4">
              <DetailRow label="Access token" value="Kept in memory · 15 minutes" />
              <DetailRow label="Refresh token" value="httpOnly cookie · 7 days" />
              <DetailRow label="Rotation" value="A new refresh token on every renewal" />
              <DetailRow label="After reload" value="Session restored from the refresh cookie" />
            </dl>
          </div>

          <div className="surface surface-shadow p-6">
            <h2 className="text-lg font-bold text-ink-900">Session security</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">
              The access token never touches localStorage, so a cross-site scripting bug cannot read
              it. The refresh cookie is httpOnly and scoped to the auth routes, which limits where
              the browser sends it.
            </p>
          </div>
        </section>
      </div>
    </Container>
  );
}
