import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { buttonStyles } from '@/components/ui/button-styles';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/features/auth/useAuth';
import { SITE_NAME } from '@/lib/constants';
import { Container } from './Container';

function navLinkClass({ isActive }: { isActive: boolean }): string {
  return `rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
  }`;
}

export function Header() {
  const { status, user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut(): Promise<void> {
    setSigningOut(true);
    await logout();
    setSigningOut(false);
    setMenuOpen(false);
    navigate('/');
  }

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200/70 bg-white/85 backdrop-blur-sm">
      <Container className="flex h-16 items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2.5" onClick={closeMenu}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-brand-500 to-brand-800 text-lg font-extrabold text-white">
            B
          </span>
          <span className="text-lg font-extrabold tracking-tight text-ink-900">{SITE_NAME}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          {status === 'authenticated' && (
            <NavLink to="/account" className={navLinkClass}>
              Account
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className={navLinkClass}>
              Admin
            </NavLink>
          )}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {status === 'loading' && <Skeleton className="h-9 w-40 rounded-xl" />}

          {status === 'guest' && (
            <>
              <Link to="/login" className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
                Sign in
              </Link>
              <Link to="/register" className={buttonStyles({ size: 'sm' })}>
                Create account
              </Link>
            </>
          )}

          {status === 'authenticated' && user && (
            <>
              <Link
                to="/account"
                className="flex items-center gap-2 rounded-full py-1 pr-3 pl-1 transition hover:bg-ink-100"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-32 truncate text-sm font-medium text-ink-800">
                  {user.name}
                </span>
              </Link>
              <Button variant="secondary" size="sm" onClick={handleSignOut} loading={signingOut}>
                Sign out
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-ink-700 transition hover:bg-ink-100 md:hidden"
          aria-expanded={menuOpen}
          aria-label="Toggle navigation"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
            {menuOpen ? (
              <path
                d="m6 6 12 12M18 6 6 18"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
      </Container>

      {menuOpen && (
        <div className="border-t border-ink-200 bg-white md:hidden">
          <Container className="flex flex-col gap-1 py-4">
            <NavLink to="/" end className={navLinkClass} onClick={closeMenu}>
              Home
            </NavLink>
            {status === 'authenticated' && (
              <NavLink to="/account" className={navLinkClass} onClick={closeMenu}>
                Account
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin" className={navLinkClass} onClick={closeMenu}>
                Admin
              </NavLink>
            )}

            <div className="mt-3 flex flex-col gap-2 border-t border-ink-200 pt-3">
              {status === 'guest' && (
                <>
                  <Link
                    to="/login"
                    className={buttonStyles({ variant: 'secondary', fullWidth: true })}
                    onClick={closeMenu}
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className={buttonStyles({ fullWidth: true })}
                    onClick={closeMenu}
                  >
                    Create account
                  </Link>
                </>
              )}
              {status === 'authenticated' && (
                <Button variant="secondary" fullWidth onClick={handleSignOut} loading={signingOut}>
                  Sign out
                </Button>
              )}
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
