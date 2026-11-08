import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  IndianRupee,
  Package,
  ShoppingCart,
  TicketPercent,
  TrendingUp,
  Users,
} from 'lucide-react';
import { getErrorMessage } from '@/api/errors';
import { Container } from '@/components/layout/Container';
import { OrderStatusBadge } from '@/components/order/OrderStatusBadge';
import { Badge } from '@/components/ui/Badge';
import { buttonStyles } from '@/components/ui/button-styles';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAdminStats } from '@/hooks/useAdminDashboard';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatDate, formatPrice } from '@/lib/format';
import type { OrderStatus } from '@/types/order';

const STATUS_ORDER: OrderStatus[] = ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'];

function dayLabel(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);

  return parsed.toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'UTC' });
}

function DashboardSkeleton() {
  return (
    <Container className="py-10 sm:py-14">
      <Skeleton className="h-4 w-24 rounded-full" />
      <Skeleton className="mt-4 h-12 w-72 rounded-xl" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-36 rounded-2xl" />
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </Container>
  );
}

export function AdminDashboardPage() {
  useDocumentTitle('Admin dashboard');
  const statsQuery = useAdminStats();

  if (statsQuery.isPending) {
    return <DashboardSkeleton />;
  }

  if (statsQuery.isError) {
    return (
      <Container className="py-14 sm:py-20">
        <ErrorState
          title="Dashboard could not be loaded"
          message={getErrorMessage(statsQuery.error)}
          onRetry={() => void statsQuery.refetch()}
        />
      </Container>
    );
  }

  const stats = statsQuery.data;
  const maxDailyRevenue = Math.max(...stats.dailySales.map((day) => day.revenue), 1);

  const cards = [
    {
      label: 'Revenue',
      value: formatPrice(stats.revenue.total),
      hint: `Today ${formatPrice(stats.revenue.today)} · 30 days ${formatPrice(stats.revenue.last30Days)}`,
      icon: IndianRupee,
    },
    {
      label: 'Orders',
      value: String(stats.orders.total),
      hint: `${stats.orders.pendingPayments} awaiting payment`,
      icon: ShoppingCart,
    },
    {
      label: 'Customers',
      value: String(stats.customers.total),
      hint: `${stats.customers.newLast30Days} joined in 30 days`,
      icon: Users,
    },
    {
      label: 'Active products',
      value: String(stats.products.total),
      hint: `${stats.products.lowStock} low stock · ${stats.products.outOfStock} out of stock`,
      icon: Package,
    },
  ];

  return (
    <Container className="py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.2em] text-accent-600 uppercase">
            Overview
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
            Dashboard.
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            Revenue, orders and catalogue health in one place.
          </p>
        </div>

        <Link to="/admin/orders" className={buttonStyles({ variant: 'secondary', size: 'sm' })}>
          Order desk
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, hint, icon: Icon }) => (
          <div key={label} className="surface p-5 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-bold tracking-[0.14em] text-ink-500 uppercase">
                {label}
              </p>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-4 font-display text-3xl font-semibold text-ink-900 tabular-nums">
              {value}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-500">{hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <section className="surface p-6 shadow-soft sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold text-ink-900">
                Revenue, last 7 days
              </h2>
              <p className="text-xs text-ink-500">
                Paid orders only, in integer paise on the server.
              </p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>

          <div
            className="mt-8 flex h-44 items-end gap-2 sm:gap-3"
            role="img"
            aria-label="Daily revenue chart"
          >
            {stats.dailySales.map((day) => {
              const height = Math.max(
                (day.revenue / maxDailyRevenue) * 100,
                day.revenue > 0 ? 6 : 2,
              );

              return (
                <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className={`w-full rounded-t-lg ${
                        day.revenue > 0 ? 'bg-brand-700' : 'bg-ink-200'
                      }`}
                      style={{ height: `${height}%` }}
                      title={`${formatPrice(day.revenue)} · ${day.orders} orders`}
                    />
                  </div>
                  <p className="text-[10px] font-semibold tracking-wide text-ink-500 uppercase">
                    {dayLabel(day.date)}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-ink-200/80 pt-4 text-xs text-ink-500">
            <span>7-day total</span>
            <span className="font-semibold text-ink-900 tabular-nums">
              {formatPrice(stats.dailySales.reduce((sum, day) => sum + day.revenue, 0))}
            </span>
          </div>
        </section>

        <section className="surface p-6 shadow-soft sm:p-7">
          <h2 className="font-display text-xl font-semibold text-ink-900">Order pipeline</h2>
          <p className="text-xs text-ink-500">Every order ever placed.</p>

          <ul className="mt-5 space-y-2.5">
            {STATUS_ORDER.map((status) => (
              <li
                key={status}
                className="flex items-center justify-between gap-3 rounded-xl bg-ink-50/70 px-3 py-2.5"
              >
                <OrderStatusBadge status={status} />
                <span className="text-sm font-semibold text-ink-900 tabular-nums">
                  {stats.orders.byStatus[status] ?? 0}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-5 space-y-2 border-t border-ink-200/80 pt-4 text-xs">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-ink-500">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                Low stock
              </span>
              <span className="font-semibold text-ink-900 tabular-nums">
                {stats.products.lowStock}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-ink-500">
                <TicketPercent className="h-3.5 w-3.5" aria-hidden="true" />
                Active coupons
              </span>
              <span className="font-semibold text-ink-900 tabular-nums">
                {stats.coupons.active} / {stats.coupons.total}
              </span>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="surface overflow-hidden shadow-soft">
          <div className="flex items-center justify-between gap-3 px-6 pt-6 pb-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-ink-900">Top products</h2>
              <p className="text-xs text-ink-500">By units sold, excluding cancelled orders.</p>
            </div>
            <Link to="/admin/products" className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
              Manage
            </Link>
          </div>

          {stats.topProducts.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-ink-500">No sales recorded yet.</p>
          ) : (
            <ul className="divide-y divide-ink-100 border-t border-ink-100">
              {stats.topProducts.map((product, index) => (
                <li key={product.productId} className="flex items-center gap-3 px-6 py-3.5">
                  <span className="font-display text-sm font-semibold text-accent-600">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/products/${product.slug}`}
                      className="truncate text-sm font-medium text-ink-900 hover:text-brand-700"
                    >
                      {product.name}
                    </Link>
                    <p className="text-xs text-ink-500">{product.unitsSold} units sold</p>
                  </div>
                  <span className="text-sm font-semibold text-ink-900 tabular-nums">
                    {formatPrice(product.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface overflow-hidden shadow-soft">
          <div className="flex items-center justify-between gap-3 px-6 pt-6 pb-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-ink-900">Low stock</h2>
              <p className="text-xs text-ink-500">Restock these before they sell out.</p>
            </div>
            <Link to="/admin/products" className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
              Update stock
            </Link>
          </div>

          {stats.lowStockProducts.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-ink-500">Every active product is well stocked.</p>
          ) : (
            <ul className="divide-y divide-ink-100 border-t border-ink-100">
              {stats.lowStockProducts.map((product) => (
                <li key={product.id} className="flex items-center gap-3 px-6 py-3.5">
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/products/${product.slug}`}
                      className="block truncate text-sm font-medium text-ink-900 hover:text-brand-700"
                    >
                      {product.name}
                    </Link>
                    <p className="text-xs text-ink-500">{formatPrice(product.price)}</p>
                  </div>
                  <Badge tone={product.stock === 0 ? 'danger' : 'warning'}>
                    {product.stock === 0 ? 'Out' : `${product.stock} left`}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="surface mt-6 overflow-hidden shadow-soft">
        <div className="flex items-center justify-between gap-3 px-6 pt-6 pb-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink-900">Recent orders</h2>
            <p className="text-xs text-ink-500">The five latest orders across all customers.</p>
          </div>
          <Link to="/admin/orders" className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
            All orders
          </Link>
        </div>

        {stats.recentOrders.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-ink-500">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto border-t border-ink-100">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-ink-50/80 text-[11px] font-bold tracking-[0.08em] text-ink-500 uppercase">
                <tr>
                  <th className="px-6 py-3">Order</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Placed</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Total</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="transition hover:bg-ink-50/60">
                    <td className="px-6 py-3.5 font-mono text-xs font-semibold text-ink-900">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="font-medium text-ink-900">{order.customer.name}</p>
                      <p className="text-xs text-ink-500">{order.customer.email}</p>
                    </td>
                    <td className="px-6 py-3.5 text-ink-600">{formatDate(order.createdAt)}</td>
                    <td className="px-6 py-3.5">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-3.5 text-right font-semibold text-ink-900 tabular-nums">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Link
                        to={`/admin/orders/${order.id}`}
                        className={buttonStyles({ variant: 'ghost', size: 'sm' })}
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Container>
  );
}
