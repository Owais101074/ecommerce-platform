import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Package, ShoppingBag } from 'lucide-react';
import { getErrorMessage } from '@/api/errors';
import { Container } from '@/components/layout/Container';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/order/OrderStatusBadge';
import { buttonStyles } from '@/components/ui/button-styles';
import { ErrorState } from '@/components/ui/ErrorState';
import { Pagination } from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useOrders } from '@/hooks/useOrders';
import { formatDate, formatPrice } from '@/lib/format';

export function OrdersPage() {
  useDocumentTitle('Your orders');
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1);
  const ordersQuery = useOrders(page);

  function changePage(nextPage: number): void {
    setSearchParams(nextPage > 1 ? { page: String(nextPage) } : {});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (ordersQuery.isPending) {
    return (
      <Container className="py-12 sm:py-16">
        <Skeleton className="h-4 w-24 rounded-full" />
        <Skeleton className="mt-4 h-12 w-64 rounded-xl" />
        <div className="mt-10 space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-2xl" />
          ))}
        </div>
      </Container>
    );
  }

  if (ordersQuery.isError) {
    return (
      <Container className="py-14 sm:py-20">
        <ErrorState
          title="Your orders could not be loaded"
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
          <p className="text-[11px] font-bold tracking-[0.2em] text-accent-600 uppercase">
            Purchase history
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
            Your orders.
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            {meta.total} {meta.total === 1 ? 'order' : 'orders'} placed with this account.
          </p>
        </div>

        <Link to="/products" className={buttonStyles({ variant: 'secondary', size: 'sm' })}>
          <ShoppingBag className="h-4 w-4" aria-hidden="true" />
          Shop again
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="surface mt-8 flex flex-col items-center px-6 py-16 text-center shadow-soft">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <Package className="h-7 w-7" aria-hidden="true" />
          </span>
          <h2 className="mt-5 font-display text-3xl font-semibold text-ink-900">No orders yet.</h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
            When you place an order it will appear here with its items and totals.
          </p>
          <Link to="/products" className={`${buttonStyles({ size: 'lg' })} mt-7`}>
            Find something to order
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8 space-y-4">
            {orders.map((order) => (
              <article key={order.id} className="surface p-5 shadow-soft sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs tracking-wide text-ink-500">
                      {order.orderNumber}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-ink-900">
                      Placed {formatDate(order.createdAt)}
                    </p>
                    <p className="mt-1 text-xs text-ink-500">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} items ·{' '}
                      {order.items
                        .slice(0, 2)
                        .map((item) => item.name)
                        .join(', ')}
                      {order.items.length > 2 ? '…' : ''}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <OrderStatusBadge status={order.status} />
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-ink-100 pt-4">
                  <p className="text-sm text-ink-500">
                    Total{' '}
                    <span className="ml-1 text-base font-bold text-ink-900 tabular-nums">
                      {formatPrice(order.total)}
                    </span>
                  </p>
                  <Link
                    to={`/orders/${order.id}`}
                    className={buttonStyles({ variant: 'secondary', size: 'sm' })}
                  >
                    View order
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={changePage} />
        </>
      )}
    </Container>
  );
}
