import { Link } from 'react-router-dom';
import { ArrowRight, KeyRound, Layers, PackageSearch, ShieldCheck } from 'lucide-react';
import { getErrorMessage } from '@/api/errors';
import { Container } from '@/components/layout/Container';
import { buttonStyles } from '@/components/ui/button-styles';
import { useAdminPing } from '@/hooks/useAdminPing';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const layers = [
  {
    icon: ShieldCheck,
    title: 'Client guard',
    copy: 'RequireAdmin checks your role before the page renders.',
  },
  {
    icon: Layers,
    title: 'API middleware',
    copy: 'authorize("admin") rejects every other role with a 403.',
  },
  {
    icon: KeyRound,
    title: 'Session token',
    copy: 'Access tokens carry the role and expire after 15 minutes.',
  },
];

export function AdminPage() {
  useDocumentTitle('Admin');
  const ping = useAdminPing();

  return (
    <Container className="py-12 sm:py-16">
      <p className="flex items-center gap-2.5 text-[11px] font-bold tracking-[0.2em] text-accent-600 uppercase">
        <span className="h-px w-6 bg-accent-400" aria-hidden="true" />
        Admin
      </p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
        Admin console.
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-500">
        This route is protected twice: the client guard checks your role before rendering, and the
        API rejects any non-admin token with a 403.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative min-h-64 overflow-hidden rounded-3xl bg-brand-900 p-7 text-cream shadow-soft sm:p-8">
          <div className="dot-grid-light absolute inset-0 opacity-40" aria-hidden="true" />
          <div
            className="absolute -bottom-16 -right-10 h-56 w-56 rounded-full bg-accent-500/20 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative flex h-full flex-col">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cream/10 ring-1 ring-cream/15 ring-inset">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </span>

            {ping.isPending ? (
              <div className="mt-6 space-y-3">
                <div className="h-4 w-28 animate-pulse rounded bg-cream/10" />
                <div className="h-9 w-64 animate-pulse rounded bg-cream/10" />
                <div className="h-4 w-72 animate-pulse rounded bg-cream/10" />
              </div>
            ) : ping.isError ? (
              <div className="mt-6">
                <p className="text-[11px] font-bold tracking-[0.18em] text-red-300 uppercase">
                  Check failed
                </p>
                <h2 className="mt-2 font-display text-3xl font-semibold">Access not confirmed</h2>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-cream/60">
                  {getErrorMessage(ping.error)}
                </p>
                <button
                  type="button"
                  onClick={() => void ping.refetch()}
                  className="mt-6 inline-flex items-center gap-2 rounded-full border border-cream/20 px-4 py-2 text-sm font-semibold text-cream transition hover:border-cream/40"
                >
                  Try again
                </button>
              </div>
            ) : (
              <>
                <p className="mt-6 text-[11px] font-bold tracking-[0.18em] text-accent-300 uppercase">
                  Access verified
                </p>
                <h2 className="mt-2 font-display text-3xl font-semibold">
                  {ping.data ?? 'Admin access granted'}
                </h2>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-cream/60">
                  The server confirmed your admin role on{' '}
                  <code className="rounded bg-cream/10 px-1.5 py-0.5 font-mono text-xs">
                    GET /admin/ping
                  </code>
                  . Use the order desk to move customer orders through their lifecycle.
                </p>
                <div className="mt-auto pt-8">
                  <span className="inline-flex items-center gap-2 rounded-full border border-cream/15 bg-cream/5 px-3 py-1.5 text-xs text-cream/70">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-300" aria-hidden="true" />
                    Signed in as administrator
                  </span>
                </div>
              </>
            )}
          </div>
        </section>

        <section className="surface p-6 shadow-soft sm:p-7">
          <h2 className="font-display text-xl font-semibold text-ink-900">
            Two layers of protection
          </h2>
          <p className="mt-1 text-xs text-ink-500">Neither layer trusts the other.</p>

          <ul className="mt-6 space-y-5">
            {layers.map(({ icon: Icon, title, copy }, index) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-100 text-ink-700">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink-900">
                    <span className="mr-2 font-display text-xs text-accent-600">0{index + 1}</span>
                    {title}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{copy}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-6 rounded-xl bg-ink-50 px-4 py-3 text-xs leading-relaxed text-ink-500">
            Order management is live. Catalogue, customer and coupon management arrive in Phase 10.
          </p>

          <Link to="/admin/orders" className={`${buttonStyles({ fullWidth: true })} mt-4`}>
            <PackageSearch className="h-4 w-4" aria-hidden="true" />
            Manage orders
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </Container>
  );
}
