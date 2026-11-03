import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  KeyRound,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { buttonStyles } from '@/components/ui/button-styles';
import { useAuth } from '@/features/auth/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatDate, initials } from '@/lib/format';

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-ink-100 py-3 last:border-0">
      <dt className="flex items-center gap-2 text-sm text-ink-500">
        <Icon className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
        {label}
      </dt>
      <dd className="text-right text-sm font-medium break-all text-ink-900">{value}</dd>
    </div>
  );
}

const roadmap = [
  {
    title: 'Browse and search',
    copy: 'Product listing, filters and detail pages.',
  },
  {
    title: 'Cart and wishlist',
    copy: 'Saved items and quantities synced to your account.',
  },
  {
    title: 'Checkout and orders',
    copy: 'Addresses, payment and order history.',
  },
];

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
    <Container className="py-12 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="flex items-center gap-2.5 text-[11px] font-bold tracking-[0.2em] text-accent-600 uppercase">
            <span className="h-px w-6 bg-accent-400" aria-hidden="true" />
            Account
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
            Your corner of Bazaar.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-500">
            Profile details come from the signed-in session served by the API.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <Link to="/admin" className={buttonStyles({ variant: 'secondary' })}>
              Admin area
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
          <Button variant="secondary" onClick={handleSignOut} loading={signingOut}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </Button>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative overflow-hidden rounded-3xl bg-brand-900 p-7 text-cream shadow-soft sm:p-8">
          <div className="dot-grid-light absolute inset-0 opacity-40" aria-hidden="true" />
          <div
            className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-accent-500/20 blur-2xl"
            aria-hidden="true"
          />

          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cream/10 font-display text-2xl font-semibold ring-1 ring-cream/15 ring-inset">
                {initials(user.name)}
              </span>
              <span className="rounded-full border border-cream/15 bg-cream/5 px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-cream/80 uppercase">
                {isAdmin ? 'Administrator' : 'Customer'}
              </span>
            </div>

            <h2 className="mt-6 font-display text-3xl font-semibold">{user.name}</h2>
            <p className="mt-1 text-sm text-cream/60">{user.email}</p>

            <dl className="mt-8 space-y-3 border-t border-cream/10 pt-6 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-cream/50">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                  Member since
                </dt>
                <dd className="font-medium text-cream/90">{formatDate(user.createdAt)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-cream/50">
                  <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
                  Role
                </dt>
                <dd className="font-medium text-cream/90 capitalize">{user.role}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-cream/50">
                  <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                  User ID
                </dt>
                <dd className="max-w-40 truncate font-mono text-xs text-cream/70">{user.id}</dd>
              </div>
            </dl>
          </div>
        </section>

        <div className="space-y-6">
          <section className="surface p-6 shadow-soft sm:p-7">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-display text-xl font-semibold text-ink-900">
                  Session &amp; security
                </h2>
                <p className="text-xs text-ink-500">How this browser stays signed in.</p>
              </div>
            </div>

            <dl className="mt-5">
              <DetailRow icon={KeyRound} label="Access token" value="In memory · 15 minutes" />
              <DetailRow
                icon={ShieldCheck}
                label="Refresh token"
                value="httpOnly cookie · 7 days"
              />
              <DetailRow icon={RefreshCw} label="Rotation" value="New token on every renewal" />
              <DetailRow
                icon={ShieldCheck}
                label="After reload"
                value="Session restored silently"
              />
            </dl>

            <p className="mt-4 text-xs leading-relaxed text-ink-400">
              The access token never touches localStorage, so a cross-site scripting bug cannot read
              it. The refresh cookie is httpOnly and scoped to the auth routes.
            </p>
          </section>

          <section className="surface p-6 shadow-soft sm:p-7">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-display text-xl font-semibold text-ink-900">What comes next</h2>
                <p className="text-xs text-ink-500">This storefront grows one phase at a time.</p>
              </div>
            </div>

            <ol className="mt-5 space-y-4">
              {roadmap.map((item, index) => (
                <li key={item.title} className="flex gap-4">
                  <span className="font-display text-sm font-semibold text-accent-600">
                    0{index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{item.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{item.copy}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </Container>
  );
}
