import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { RequireAdmin, RequireAuth } from './guards';

const auth = vi.hoisted(() => ({
  status: 'guest' as 'guest' | 'loading' | 'authenticated',
  isAdmin: false,
}));

vi.mock('@/features/auth/useAuth', () => ({
  useAuth: () => auth,
}));

function LoginProbe() {
  const location = useLocation();
  const state = location.state as { from?: string } | null;

  return <p>login page {state?.from ?? 'no-from'}</p>;
}

function renderGuarded(path: string, area: 'account' | 'admin') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<LoginProbe />} />
        <Route
          path={path}
          element={
            area === 'account' ? (
              <RequireAuth>
                <p>account area</p>
              </RequireAuth>
            ) : (
              <RequireAdmin>
                <p>admin area</p>
              </RequireAdmin>
            )
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  auth.status = 'guest';
  auth.isAdmin = false;
});

describe('RequireAuth', () => {
  it('sends guests to login and remembers the intended path', () => {
    renderGuarded('/cart', 'account');

    expect(screen.getByText('login page /cart')).toBeInTheDocument();
  });

  it('shows a loader while the session is being checked', () => {
    auth.status = 'loading';

    renderGuarded('/cart', 'account');

    expect(screen.getByText('Checking your session…')).toBeInTheDocument();
  });

  it('renders children for authenticated users', () => {
    auth.status = 'authenticated';

    renderGuarded('/cart', 'account');

    expect(screen.getByText('account area')).toBeInTheDocument();
  });
});

describe('RequireAdmin', () => {
  it('sends guests to login with the admin destination', () => {
    renderGuarded('/admin/orders', 'admin');

    expect(screen.getByText('login page /admin/orders')).toBeInTheDocument();
  });

  it('blocks authenticated customers', () => {
    auth.status = 'authenticated';

    renderGuarded('/admin/orders', 'admin');

    expect(screen.getByText('Admins only')).toBeInTheDocument();
    expect(screen.queryByText('admin area')).not.toBeInTheDocument();
  });

  it('renders children for admins', () => {
    auth.status = 'authenticated';
    auth.isAdmin = true;

    renderGuarded('/admin/orders', 'admin');

    expect(screen.getByText('admin area')).toBeInTheDocument();
  });
});
