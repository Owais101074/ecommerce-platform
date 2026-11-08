import { NavLink, Outlet } from 'react-router-dom';
import {
  FolderTree,
  LayoutDashboard,
  Package,
  ShieldCheck,
  ShoppingCart,
  TicketPercent,
  Users,
} from 'lucide-react';
import { Container } from './Container';

const navigation = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/coupons', label: 'Coupons', icon: TicketPercent },
];

export function AdminLayout() {
  return (
    <>
      <div className="border-b border-ink-200/70 bg-paper/90">
        <Container className="flex flex-wrap items-center justify-between gap-4 py-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-900 text-cream">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-accent-600 uppercase">
                Admin
              </p>
              <p className="font-display text-sm font-semibold text-ink-900">Operations desk</p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-1" aria-label="Admin sections">
            {navigation.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-brand-800 text-cream'
                      : 'text-ink-600 hover:bg-ink-900/5 hover:text-ink-900'
                  }`
                }
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
        </Container>
      </div>

      <Outlet />
    </>
  );
}
