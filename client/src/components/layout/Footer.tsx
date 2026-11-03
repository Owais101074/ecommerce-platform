import { Link } from 'react-router-dom';
import { ArrowUpRight, Code2, Sparkles } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/constants';
import { Container } from './Container';

const stack = ['React', 'TypeScript', 'Express', 'MongoDB'];

const exploreLinks = [
  { label: 'Home', to: '/' },
  { label: 'Departments', to: '/#categories' },
  { label: 'New arrivals', to: '/#new-arrivals' },
];

export function Footer() {
  const { isAuthenticated, isAdmin } = useAuth();

  const accountLinks = isAuthenticated
    ? [
        { label: 'Your account', to: '/account' },
        ...(isAdmin ? [{ label: 'Admin console', to: '/admin' }] : []),
      ]
    : [
        { label: 'Sign in', to: '/login' },
        { label: 'Create account', to: '/register' },
      ];

  return (
    <footer className="relative mt-24 overflow-hidden bg-brand-900 text-cream">
      <div className="dot-grid-light absolute inset-0 opacity-50" aria-hidden="true" />
      <div
        className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl"
        aria-hidden="true"
      />

      <Container className="relative grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1.1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-cream font-display text-sm leading-none font-semibold text-brand-900">
              b
              <span className="absolute top-1 right-1 h-1 w-1 rounded-full bg-accent-500" />
            </span>
            <span className="font-display text-xl leading-none font-semibold">
              {SITE_NAME.toLowerCase()}
              <span className="text-accent-400">.</span>
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/60">{SITE_TAGLINE}</p>
          <a
            href="https://github.com/Owais101074/ecommerce-platform"
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-cream/15 px-3.5 py-2 text-xs font-semibold text-cream/80 transition hover:border-cream/30 hover:text-cream"
          >
            <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
            View the repository
            <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
          </a>
        </div>

        <div>
          <h2 className="text-[11px] font-bold tracking-[0.18em] text-cream/40 uppercase">
            Explore
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {exploreLinks.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="text-cream/70 transition hover:text-cream">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-[11px] font-bold tracking-[0.18em] text-cream/40 uppercase">
            Account
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {accountLinks.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="text-cream/70 transition hover:text-cream">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-[11px] font-bold tracking-[0.18em] text-cream/40 uppercase">
            Built with
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {stack.map((item) => (
              <li
                key={item}
                className="rounded-full bg-cream/10 px-3 py-1 text-xs font-medium text-cream/70 ring-1 ring-cream/10 ring-inset"
              >
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 flex items-center gap-1.5 text-xs text-cream/50">
            <Sparkles className="h-3.5 w-3.5 text-accent-300" aria-hidden="true" />
            Prices in INR, stored as integer paise.
          </p>
        </div>
      </Container>

      <div className="relative border-t border-cream/10">
        <Container className="flex flex-col gap-2 py-6 text-xs text-cream/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE_NAME}. A learning project built phase by phase.
          </p>
          <p>React · TypeScript · Express · MongoDB</p>
        </Container>
      </div>

      <div className="relative overflow-hidden" aria-hidden="true">
        <p className="translate-y-[0.18em] text-center font-display text-[19vw] leading-none font-semibold tracking-tight text-cream/[0.045] select-none">
          {SITE_NAME.toLowerCase()}
        </p>
      </div>
    </footer>
  );
}
