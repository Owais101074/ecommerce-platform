import { useState } from 'react';
import { Ban } from 'lucide-react';
import { getErrorMessage } from '@/api/errors';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { useCancelOrder } from '@/hooks/useOrders';
import type { Order } from '@/types/order';

export function CancelOrderCard({ order }: { order: Order }) {
  const cancelOrder = useCancelOrder();
  const [confirming, setConfirming] = useState(false);

  if (order.status !== 'placed' && order.status !== 'confirmed') {
    return null;
  }

  async function handleCancel(): Promise<void> {
    try {
      await cancelOrder.mutateAsync(order.id);
      setConfirming(false);
    } catch {
      // The hook already shows the error toast; the alert below keeps it visible.
    }
  }

  return (
    <section className="surface p-6 shadow-soft sm:p-7">
      <h2 className="font-display text-2xl font-semibold text-ink-900">Need to cancel?</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-600">
        {order.paymentStatus === 'paid'
          ? 'You can cancel until the order ships. The payment is refunded to the original method.'
          : 'You can cancel until the order ships. Nothing is charged for this order.'}
      </p>

      {cancelOrder.isError && (
        <div className="mt-4">
          <Alert variant="error" title="Cancellation failed">
            {getErrorMessage(cancelOrder.error)}
          </Alert>
        </div>
      )}

      {confirming ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="danger"
            loading={cancelOrder.isPending}
            onClick={() => void handleCancel()}
          >
            Confirm cancellation
          </Button>
          <Button
            variant="secondary"
            disabled={cancelOrder.isPending}
            onClick={() => setConfirming(false)}
          >
            Keep order
          </Button>
        </div>
      ) : (
        <Button variant="secondary" className="mt-4" onClick={() => setConfirming(true)}>
          <Ban className="h-4 w-4" aria-hidden="true" />
          Cancel order
        </Button>
      )}
    </section>
  );
}
