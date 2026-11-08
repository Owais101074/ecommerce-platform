import { Ban, CheckCircle2, Package, PackageCheck, Truck } from 'lucide-react';
import type { Order, OrderStatus } from '@/types/order';
import { formatDateTime } from '@/lib/format';

const eventMeta: Record<OrderStatus, { label: string; icon: typeof Package; className: string }> = {
  placed: { label: 'Order placed', icon: Package, className: 'bg-ink-100 text-ink-700' },
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle2,
    className: 'bg-brand-50 text-brand-700',
  },
  shipped: { label: 'Shipped', icon: Truck, className: 'bg-accent-50 text-accent-700' },
  delivered: { label: 'Delivered', icon: PackageCheck, className: 'bg-brand-800 text-cream' },
  cancelled: { label: 'Cancelled', icon: Ban, className: 'bg-red-50 text-red-700' },
};

export function OrderTimeline({ order }: { order: Order }) {
  return (
    <section className="surface p-6 shadow-soft sm:p-7">
      <h2 className="font-display text-2xl font-semibold text-ink-900">Timeline</h2>
      <p className="mt-1 text-xs text-ink-500">Every transition is recorded by the server.</p>

      <ol className="mt-5">
        {order.statusHistory.map((event, index) => {
          const meta = eventMeta[event.status];
          const Icon = meta.icon;
          const isLast = index === order.statusHistory.length - 1;

          return (
            <li
              key={`${event.status}-${event.at}-${index}`}
              className="relative flex gap-3 pb-5 last:pb-0"
            >
              {!isLast && (
                <span
                  className="absolute top-9 left-[15px] h-[calc(100%-2.25rem)] w-px bg-ink-200"
                  aria-hidden="true"
                />
              )}
              <span
                className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.className}`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 pt-1">
                <p className="text-sm font-semibold text-ink-900">{meta.label}</p>
                <p className="mt-0.5 text-xs text-ink-500">
                  {formatDateTime(event.at)}
                  {event.note ? ` · ${event.note}` : ''}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
