import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Package } from 'lucide-react';
import { getErrorMessage } from '@/api/errors';
import { Container } from '@/components/layout/Container';
import { AdminOrderActions } from '@/components/order/AdminOrderActions';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/order/OrderStatusBadge';
import { OrderTimeline } from '@/components/order/OrderTimeline';
import { OrderTrackingCard } from '@/components/order/OrderTrackingCard';
import { buttonStyles } from '@/components/ui/button-styles';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAdminOrder } from '@/hooks/useAdminOrders';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatDate, formatPrice, initials } from '@/lib/format';

export function AdminOrderDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  useDocumentTitle('Admin order');
  const orderQuery = useAdminOrder(id);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  if (orderQuery.isPending) {
    return (
      <Container className="py-12 sm:py-16">
        <Skeleton className="h-4 w-24 rounded-full" />
        <Skeleton className="mt-4 h-12 w-72 rounded-xl" />
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </Container>
    );
  }

  if (orderQuery.isError) {
    return (
      <Container className="py-14 sm:py-20">
        <ErrorState
          title="Order not found"
          message={getErrorMessage(orderQuery.error)}
          onRetry={() => void orderQuery.refetch()}
        />
      </Container>
    );
  }

  const order = orderQuery.data;
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Container className="py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.2em] text-accent-600 uppercase">
            Admin · order details
          </p>
          <h1 className="mt-2 font-mono text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
            {order.orderNumber}
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            Placed {formatDate(order.createdAt)} · {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to="/admin/orders" className={buttonStyles({ variant: 'secondary', size: 'sm' })}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            All orders
          </Link>
          <Link to="/admin" className={buttonStyles({ size: 'sm' })}>
            Admin home
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <div className="space-y-6">
          <section className="surface p-6 shadow-soft sm:p-7">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Package className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-display text-xl font-semibold text-ink-900">Items</h2>
                <p className="text-xs text-ink-500">
                  Order-time snapshots, not live catalogue data.
                </p>
              </div>
            </div>

            <ul className="mt-5 divide-y divide-ink-100">
              {order.items.map((item) => {
                const showImage = item.image && !failedImages[item.productId];

                return (
                  <li key={item.productId} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                    <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-ink-100 ring-1 ring-ink-200/70">
                      {showImage ? (
                        <img
                          src={item.image ?? ''}
                          alt={item.name}
                          onError={() =>
                            setFailedImages((current) => ({
                              ...current,
                              [item.productId]: true,
                            }))
                          }
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center font-display text-xs font-semibold text-brand-800">
                          {initials(item.name)}
                        </span>
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-900">{item.name}</p>
                      <p className="mt-1 text-xs text-ink-500">
                        {item.quantity} × {formatPrice(item.price)}
                      </p>
                    </div>

                    <p className="text-sm font-bold text-ink-900 tabular-nums">
                      {formatPrice(item.lineTotal)}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="surface p-6 shadow-soft sm:p-7">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-display text-xl font-semibold text-ink-900">
                  Delivery address
                </h2>
                <p className="text-xs text-ink-500">Snapshot taken at checkout.</p>
              </div>
            </div>

            <div className="mt-5 space-y-1 text-sm leading-relaxed text-ink-600">
              <p className="font-medium text-ink-900">{order.address.fullName}</p>
              <p>{order.address.phone}</p>
              <p>
                {order.address.line1}
                {order.address.line2 ? `, ${order.address.line2}` : ''}
              </p>
              <p>
                {order.address.city}, {order.address.state} {order.address.pincode}
              </p>
            </div>
          </section>

          <OrderTimeline order={order} />

          {order.tracking && <OrderTrackingCard tracking={order.tracking} />}
        </div>

        <aside className="space-y-6">
          <section className="surface p-6 shadow-soft sm:p-7">
            <h2 className="font-display text-2xl font-semibold text-ink-900">Customer</h2>
            <div className="mt-4 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-800 text-xs font-bold text-cream">
                {initials(order.customer.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink-900">{order.customer.name}</p>
                <p className="truncate text-xs text-ink-500">{order.customer.email}</p>
              </div>
            </div>
            <p className="mt-4 font-mono text-[11px] text-ink-400">ID {order.customer.id}</p>
          </section>

          <section className="surface p-6 shadow-soft sm:p-7">
            <h2 className="font-display text-2xl font-semibold text-ink-900">Current status</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <OrderStatusBadge status={order.status} />
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>
          </section>

          <AdminOrderActions order={order} />

          <section className="surface p-6 shadow-soft sm:p-7">
            <h2 className="font-display text-2xl font-semibold text-ink-900">Payment summary</h2>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-ink-500">Subtotal</dt>
                <dd className="font-semibold text-ink-900 tabular-nums">
                  {formatPrice(order.subtotal)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-ink-500">Shipping</dt>
                <dd className="font-semibold text-ink-900 tabular-nums">
                  {order.shipping === 0 ? 'Free' : formatPrice(order.shipping)}
                </dd>
              </div>
              {order.discount > 0 && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-ink-500">Discount</dt>
                  <dd className="font-semibold text-brand-700 tabular-nums">
                    −{formatPrice(order.discount)}
                  </dd>
                </div>
              )}
              <div className="flex items-center justify-between gap-4 text-xs text-ink-500">
                <dt>Includes GST (18%)</dt>
                <dd className="tabular-nums">{formatPrice(order.tax)}</dd>
              </div>
            </dl>

            <div className="mt-5 flex items-center justify-between gap-4 border-t border-ink-200/80 pt-5">
              <p className="text-sm font-semibold text-ink-900">Total</p>
              <p className="text-2xl font-bold text-ink-900 tabular-nums">
                {formatPrice(order.total)}
              </p>
            </div>
          </section>
        </aside>
      </div>
    </Container>
  );
}
