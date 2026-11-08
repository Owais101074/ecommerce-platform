import { useState } from 'react';
import { Ban, CheckCircle2, PackageCheck, Truck } from 'lucide-react';
import { getErrorMessage } from '@/api/errors';
import type { AdminStatusUpdate } from '@/api/adminOrder.api';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useUpdateAdminOrderStatus } from '@/hooks/useAdminOrders';
import type { AdminOrder } from '@/types/order';

export function AdminOrderActions({ order }: { order: AdminOrder }) {
  const updateStatus = useUpdateAdminOrderStatus(order.id);
  const [carrier, setCarrier] = useState(order.tracking?.carrier ?? '');
  const [trackingNumber, setTrackingNumber] = useState(order.tracking?.trackingNumber ?? '');
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const closed = order.status === 'delivered' || order.status === 'cancelled';
  const canCancel = order.status === 'placed' || order.status === 'confirmed';
  const trackingReady = carrier.trim().length >= 2 && trackingNumber.trim().length >= 4;

  async function update(input: AdminStatusUpdate): Promise<void> {
    try {
      await updateStatus.mutateAsync(input);
      setConfirmingCancel(false);
    } catch {
      // The hook shows the toast; the alert below keeps the message next to the actions.
    }
  }

  return (
    <section className="surface p-6 shadow-soft sm:p-7">
      <h2 className="font-display text-2xl font-semibold text-ink-900">Order actions</h2>
      <p className="mt-1 text-xs text-ink-500">
        Status changes are validated on the server against the current state.
      </p>

      {updateStatus.isError && (
        <div className="mt-4">
          <Alert variant="error" title="Status update failed">
            {getErrorMessage(updateStatus.error)}
          </Alert>
        </div>
      )}

      {closed ? (
        <div className="mt-4">
          <Alert variant="info" title="This order is closed">
            {order.status === 'delivered'
              ? 'Delivered orders cannot change again.'
              : 'Cancelled orders cannot change again.'}
          </Alert>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {order.status === 'placed' && (
            <div>
              <Button
                fullWidth
                loading={updateStatus.isPending}
                disabled={order.paymentStatus !== 'paid'}
                onClick={() => void update({ status: 'confirmed', note: 'Confirmed by admin' })}
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Mark confirmed
              </Button>
              {order.paymentStatus !== 'paid' && (
                <p className="mt-2 text-xs leading-relaxed text-ink-500">
                  The payment must be verified before this order can be confirmed.
                </p>
              )}
            </div>
          )}

          {order.status === 'confirmed' && (
            <div className="space-y-3">
              <Input
                label="Carrier"
                value={carrier}
                onChange={(event) => setCarrier(event.target.value)}
                placeholder="Delhivery, Blue Dart, India Post"
                autoComplete="off"
              />
              <Input
                label="Tracking number"
                value={trackingNumber}
                onChange={(event) => setTrackingNumber(event.target.value)}
                placeholder="AWB or consignment number"
                autoComplete="off"
              />
              <Button
                fullWidth
                loading={updateStatus.isPending}
                disabled={!trackingReady}
                onClick={() =>
                  void update({
                    status: 'shipped',
                    carrier: carrier.trim(),
                    trackingNumber: trackingNumber.trim(),
                    note: 'Handed to carrier',
                  })
                }
              >
                <Truck className="h-4 w-4" aria-hidden="true" />
                Mark shipped
              </Button>
            </div>
          )}

          {order.status === 'shipped' && (
            <Button
              fullWidth
              loading={updateStatus.isPending}
              onClick={() => void update({ status: 'delivered', note: 'Delivery confirmed' })}
            >
              <PackageCheck className="h-4 w-4" aria-hidden="true" />
              Mark delivered
            </Button>
          )}

          {canCancel && (
            <div className="border-t border-ink-100 pt-5">
              {confirmingCancel ? (
                <div className="space-y-2">
                  <p className="text-xs leading-relaxed text-ink-500">
                    Stock is restored
                    {order.paymentStatus === 'paid'
                      ? ' and the payment is refunded to the customer.'
                      : ' and nothing is charged.'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="danger"
                      loading={updateStatus.isPending}
                      onClick={() => void update({ status: 'cancelled' })}
                    >
                      Confirm cancellation
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={updateStatus.isPending}
                      onClick={() => setConfirmingCancel(false)}
                    >
                      Keep order
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="secondary" onClick={() => setConfirmingCancel(true)}>
                  <Ban className="h-4 w-4" aria-hidden="true" />
                  Cancel order
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
