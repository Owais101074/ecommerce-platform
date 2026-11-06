import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ArrowRight, Heart, LogOut, Menu, ShoppingBag, Sparkles, X } from 'lucide-react';
import { BrandMark } from '@/components/ui/BrandMark';
import { Button } from '@/components/ui/Button';
import { buttonStyles } from '@/components/ui/button-styles';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/features/auth/useAuth';
import { useCartCount } from '@/hooks/useCart';
import { useWishlistCount } from '@/hooks/useWishlist';
import { initials } from '@/lib/format';
import { Container } from './Container';

const links = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/products' },
  { label: 'Departments', to: '/#categories' },
  { label: 'New in', to: '/#new-arrivals' },
];

const navLinkBase =
  'relative px-3.5 py-2 text-sm font-medium text-ink-600 transition-colors hover:text-ink-900';

function navLinkClass({ isActive }: { isActive: boolean }): string {
  return `relative px-3.5 py-2 text-sm font-medium transition-colors ${
    isActive ? 'text-ink-900' : 'text-ink-600 hover:text-ink-900'
  }`;
}

function mobileNavLinks(closeMenu: () => void) {
  return (
    <>
      {links.map((link) => (
        <Link
          key={link.label}
          to={link.to}
          onClick={closeMenu}
          className="rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-ink-900/5"
        >
          {link.label}
        </Link>
      ))}
    </>
  );
}

export function Header() {
  const { status, user, isAdmin, logout } = useAuth();
  const cartCount = useCartCount();
  const wishlistCount = useWishlistCount();
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
    <header className="sticky top-0 z-40">
      <div className="relative z-40 bg-brand-900 text-cream">
        <Container className="flex h-9 items-center justify-center gap-2 text-[11px] font-medium tracking-wide sm:justify-between">
          <p className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-accent-300" aria-hidden="true" />
            The new season edit is live
          </p>
          <Link
            to="/#new-arrivals"
            className="hidden items-center gap-1 text-cream/70 transition hover:text-cream sm:flex"
          >
            See what&apos;s new
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </Container>
      </div>

      <div className="relative z-40 border-b border-ink-200/70 bg-cream/85 backdrop-blur-md">
        <Container className="flex h-18 items-center justify-between gap-4">
          <BrandMark onClick={closeMenu} />

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/products" className={navLinkClass}>
              Shop
            </NavLink>
            <Link to="/#categories" className={navLinkBase}>
              Departments
            </Link>
            <Link to="/#new-arrivals" className={navLinkBase}>
              New in
            </Link>
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
            {status === 'loading' && <Skeleton className="h-9 w-40 rounded-full" />}

            {status === 'guest' && (
              <>
                <Link to="/login" className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
                  Sign in
                </Link>
                <Link to="/register" className={buttonStyles({ size: 'sm' })}>
                  Create account
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </>
            )}

            {status === 'authenticated' && user && (
              <>
                <Link
                  to="/wishlist"
                  aria-label={`Wishlist, ${wishlistCount} saved`}
                  title="Wishlist"
                  className="relative flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 bg-paper text-ink-600 transition hover:border-ink-300 hover:text-accent-600"
                >
                  <Heart className="h-4 w-4" aria-hidden="true" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[9px] font-bold text-white tabular-nums">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/cart"
                  aria-label={`Cart, ${cartCount} items`}
                  title="Cart"
                  className="relative flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 bg-paper text-ink-600 transition hover:border-ink-300 hover:text-brand-800"
                >
                  <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-700 px-1 text-[9px] font-bold text-cream tabular-nums">
                      {cartCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/account"
                  className="flex items-center gap-2 rounded-full py-1 pr-3 pl-1 transition hover:bg-ink-900/5"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-800 text-[11px] font-bold text-cream">
                    {initials(user.name)}
                  </span>
                  <span className="hidden max-w-32 truncate text-sm font-medium text-ink-800 lg:block">
                    {user.name}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  title="Sign out"
                  aria-label="Sign out"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 bg-paper text-ink-600 transition hover:border-ink-300 hover:text-ink-900 disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink-200 bg-paper text-ink-700 transition hover:border-ink-300 md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label="Toggle navigation"
          >
            {menuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </Container>
      </div>

      {menuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 cursor-default bg-ink-900/20 backdrop-blur-[2px] md:hidden"
            onClick={closeMenu}
            aria-label="Close navigation"
          />
          <div
            id="mobile-menu"
            className="animate-rise relative z-40 border-b border-ink-200 bg-cream shadow-lift md:hidden"
          >
            <Container className="flex flex-col gap-1 py-4">
              {mobileNavLinks(closeMenu)}
              {status === 'authenticated' && (
                <NavLink
                  to="/account"
                  onClick={closeMenu}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-ink-900/5"
                >
                  Account
                </NavLink>
              )}
              {status === 'authenticated' && (
                <>
                  <NavLink
                    to="/cart"
                    onClick={closeMenu}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-ink-900/5"
                  >
                    Cart
                    <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-bold text-brand-800 tabular-nums">
                      {cartCount}
                    </span>
                  </NavLink>
                  <NavLink
                    to="/wishlist"
                    onClick={closeMenu}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-ink-900/5"
                  >
                    Wishlist
                    <span className="rounded-full bg-accent-100 px-2 py-0.5 text-[11px] font-bold text-accent-700 tabular-nums">
                      {wishlistCount}
                    </span>
                  </NavLink>
                </>
              )}
              {isAdmin && (
                <NavLink
                  to="/admin"
                  onClick={closeMenu}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-ink-900/5"
                >
                  Admin
                </NavLink>
              )}

              <div className="mt-3 flex flex-col gap-2 border-t border-ink-200 pt-4">
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
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </>
                )}
                {status === 'authenticated' && (
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={handleSignOut}
                    loading={signingOut}
                  >
                    Sign out
                  </Button>
                )}
              </div>
            </Container>
          </div>
        </>
      )}
    </header>
  );
}
