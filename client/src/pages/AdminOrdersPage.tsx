import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, PackageSearch } from 'lucide-react';
import { getErrorMessage } from '@/api/errors';
import { Container } from '@/components/layout/Container';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/order/OrderStatusBadge';
import { buttonStyles } from '@/components/ui/button-styles';
import { ErrorState } from '@/components/ui/ErrorState';
import { Pagination } from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAdminOrders } from '@/hooks/useAdminOrders';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatDate, formatPrice } from '@/lib/format';
import type { OrderStatus } from '@/types/order';

const STATUS_VALUES: OrderStatus[] = ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const filterOptions: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  ...STATUS_VALUES.map((status) => ({ value: status, label: status })),
];

function isOrderStatus(value: string | null): value is OrderStatus {
  return value !== null && (STATUS_VALUES as string[]).includes(value);
}

export function AdminOrdersPage() {
  useDocumentTitle('Admin orders');
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1);
  const statusParam = searchParams.get('status');
  const status = isOrderStatus(statusParam) ? statusParam : undefined;
  const ordersQuery = useAdminOrders({ page, limit: 10, status });

  function changeFilter(nextStatus: OrderStatus | ''): void {
    setSearchParams(nextStatus ? { status: nextStatus } : {});
  }

  function changePage(nextPage: number): void {
    const params: Record<string, string> = {};

    if (status) {
      params.status = status;
    }

    if (nextPage > 1) {
      params.page = String(nextPage);
    }

    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (ordersQuery.isPending) {
    return (
      <Container className="py-12 sm:py-16">
        <Skeleton className="h-4 w-24 rounded-full" />
        <Skeleton className="mt-4 h-12 w-64 rounded-xl" />
        <Skeleton className="mt-10 h-80 rounded-2xl" />
      </Container>
    );
  }

  if (ordersQuery.isError) {
    return (
      <Container className="py-14 sm:py-20">
        <ErrorState
          title="Orders could not be loaded"
          message={getErrorMessage(ordersQuery.error)}
          onRetry={() => void ordersQuery.refetch()}
        />
      </Container>
    );
  }

  const { orders, meta } = ordersQuery.data;

  return (
    <Container className="py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.2em] text-accent-600 uppercase">Admin</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
            Order desk.
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            {meta.total} {meta.total === 1 ? 'order' : 'orders'}
            {status ? ` with status ${status}` : ' across every status'}.
          </p>
        </div>

        <Link to="/admin" className={buttonStyles({ variant: 'secondary', size: 'sm' })}>
          Admin home
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter orders by status">
        {filterOptions.map((option) => {
          const active = option.value === (status ?? '');

          return (
            <button
              key={option.value || 'all'}
              type="button"
              onClick={() => changeFilter(option.value)}
              aria-pressed={active}
              className={`rounded-full px-3.5 py-2 text-xs font-semibold capitalize transition ${
                active
                  ? 'bg-brand-800 text-cream'
                  : 'border border-ink-200 bg-paper text-ink-700 hover:border-ink-300'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <div className="surface mt-6 flex flex-col items-center px-6 py-16 text-center shadow-soft">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <PackageSearch className="h-7 w-7" aria-hidden="true" />
          </span>
          <h2 className="mt-5 font-display text-3xl font-semibold text-ink-900">No orders here.</h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
            {status
              ? `No orders currently have the status “${status}”.`
              : 'No customer has placed an order yet.'}
          </p>
        </div>
      ) : (
        <>
          <div className="surface mt-6 overflow-hidden shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-ink-50/80 text-[11px] font-bold tracking-[0.08em] text-ink-500 uppercase">
                  <tr>
                    <th className="px-5 py-3.5">Order</th>
                    <th className="px-5 py-3.5">Customer</th>
                    <th className="px-5 py-3.5">Placed</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Payment</th>
                    <th className="px-5 py-3.5 text-right">Total</th>
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="transition hover:bg-ink-50/60">
                      <td className="px-5 py-4">
                        <p className="font-mono text-xs font-semibold text-ink-900">
                          {order.orderNumber}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-500">
                          {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-ink-900">{order.customer.name}</p>
                        <p className="mt-0.5 text-xs text-ink-500">{order.customer.email}</p>
                      </td>
                      <td className="px-5 py-4 text-ink-600">{formatDate(order.createdAt)}</td>
                      <td className="px-5 py-4">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="px-5 py-4">
                        <PaymentStatusBadge status={order.paymentStatus} />
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-ink-900 tabular-nums">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className={buttonStyles({ variant: 'secondary', size: 'sm' })}
                        >
                          Manage
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={changePage} />
        </>
      )}
    </Container>
  );
}
