import { Truck } from 'lucide-react';
import type { OrderTracking } from '@/types/order';
import { formatDateTime } from '@/lib/format';

export function OrderTrackingCard({ tracking }: { tracking: OrderTracking }) {
  return (
    <section className="surface p-6 shadow-soft sm:p-7">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <Truck className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-xl font-semibold text-ink-900">Tracking</h2>
          <p className="text-xs text-ink-500">Updated {formatDateTime(tracking.updatedAt)}</p>
        </div>
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold tracking-[0.08em] text-ink-500 uppercase">
            Carrier
          </dt>
          <dd className="mt-1 text-sm font-semibold text-ink-900">{tracking.carrier}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold tracking-[0.08em] text-ink-500 uppercase">
            Tracking number
          </dt>
          <dd className="mt-1 font-mono text-sm font-semibold text-ink-900">
            {tracking.trackingNumber}
          </dd>
        </div>
      </dl>
    </section>
  );
}
