import { Link } from 'react-router-dom';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/constants';
import { Container } from './Container';

const stack = ['React', 'TypeScript', 'Express', 'MongoDB'];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-ink-200 bg-white">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-brand-500 to-brand-800 text-sm font-extrabold text-white">
              B
            </span>
            <span className="text-base font-extrabold text-ink-900">{SITE_NAME}</span>
          </div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-500">{SITE_TAGLINE}</p>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-ink-900">Explore</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-500">
            <li>
              <Link to="/" className="hover:text-brand-700">
                Home
              </Link>
            </li>
            <li>
              <Link to="/account" className="hover:text-brand-700">
                Your account
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-brand-700">
                Sign in
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-ink-900">Built with</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {stack.map((item) => (
              <li
                key={item}
                className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-600"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Container>

      <div className="border-t border-ink-200">
        <Container className="flex flex-col gap-2 py-6 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE_NAME}. A learning project built phase by phase.
          </p>
          <p>Prices shown in INR, stored as integer paise.</p>
        </Container>
      </div>
    </footer>
  );
}
