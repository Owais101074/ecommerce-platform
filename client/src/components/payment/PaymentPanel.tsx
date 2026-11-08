import { useState } from 'react';
import { CreditCard, FlaskConical, Lock, ShieldCheck } from 'lucide-react';
import { getErrorMessage } from '@/api/errors';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import {
  useAbandonPayment,
  useMockCompletePayment,
  useStartPayment,
  useVerifyPayment,
} from '@/hooks/usePayment';
import { SITE_NAME } from '@/lib/constants';
import { formatPrice } from '@/lib/format';
import { loadRazorpayCheckout } from '@/lib/razorpay';
import type { Order } from '@/types/order';
import type { PaymentCredentials, StartPaymentResult } from '@/types/payment';

interface PaymentPanelProps {
  order: Order;
}

export function PaymentPanel({ order }: PaymentPanelProps) {
  const startPayment = useStartPayment();
  const verifyPayment = useVerifyPayment(order.id);
  const abandonPayment = useAbandonPayment(order.id);
  const mockComplete = useMockCompletePayment(order.id);

  const [mockSession, setMockSession] = useState<StartPaymentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const busy = startPayment.isPending || verifyPayment.isPending || mockComplete.isPending;
  const wasFailed = order.paymentStatus === 'failed';

  async function completePayment(credentials: PaymentCredentials): Promise<void> {
    await verifyPayment.mutateAsync(credentials);
    setMockSession(null);
  }

  async function openCheckout(session: StartPaymentResult): Promise<void> {
    const ready = await loadRazorpayCheckout();

    if (!ready || !window.Razorpay) {
      setError('The payment window could not load. Check your connection and try again.');
      return;
    }

    const checkout = new window.Razorpay({
      key: session.keyId,
      amount: session.amount,
      currency: session.currency,
      name: SITE_NAME,
      description: `Order ${order.orderNumber}`,
      order_id: session.providerOrderId,
      prefill: {
        name: order.address.fullName,
        contact: order.address.phone,
      },
      theme: { color: '#1f513f' },
      handler: (response) => {
        void completePayment(response).catch((checkoutError: unknown) => {
          setError(getErrorMessage(checkoutError));
        });
      },
      modal: {
        ondismiss: () => {
          setMockSession(null);
          void abandonPayment.mutateAsync().catch(() => undefined);
        },
      },
    });

    checkout.open();
  }

  async function beginPayment(): Promise<void> {
    setError(null);

    try {
      const session = await startPayment.mutateAsync(order.id);

      if (session.provider === 'mock') {
        setMockSession(session);
        return;
      }

      await openCheckout(session);
    } catch (startError) {
      setError(getErrorMessage(startError));
    }
  }

  async function handleMockOutcome(outcome: 'success' | 'failure'): Promise<void> {
    setError(null);

    try {
      const result = await mockComplete.mutateAsync(outcome);

      if (result.credentials) {
        await completePayment(result.credentials);
      } else {
        setMockSession(null);
      }
    } catch (mockError) {
      setError(getErrorMessage(mockError));
    }
  }

  async function handleMockCancel(): Promise<void> {
    setMockSession(null);

    try {
      await abandonPayment.mutateAsync();
    } catch (cancelError) {
      setError(getErrorMessage(cancelError));
    }
  }

  if (order.paymentStatus === 'paid') {
    return (
      <section className="surface p-6 shadow-soft sm:p-7">
        <h2 className="font-display text-2xl font-semibold text-ink-900">Payment</h2>
        <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-ink-600">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
          Paid in full. The signature was verified on the server before the order was confirmed.
        </p>
      </section>
    );
  }

  if (order.paymentStatus === 'refunded') {
    return (
      <section className="surface p-6 shadow-soft sm:p-7">
        <h2 className="font-display text-2xl font-semibold text-ink-900">Payment</h2>
        <p className="mt-4 text-sm leading-relaxed text-ink-600">
          This order was paid and then refunded. Nothing further is due.
        </p>
      </section>
    );
  }

  return (
    <section className="surface p-6 shadow-soft sm:p-7">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-2xl font-semibold text-ink-900">Payment</h2>
        <p className="text-lg font-bold text-ink-900 tabular-nums">{formatPrice(order.total)}</p>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-ink-600">
        {wasFailed
          ? 'The last attempt did not go through. Start a new attempt whenever you are ready.'
          : 'Complete the payment to confirm this order. Nothing is charged until the gateway returns a signed payment.'}
      </p>

      {error && (
        <div className="mt-4">
          <Alert variant="error" title="Payment problem">
            {error}
          </Alert>
        </div>
      )}

      {order.status === 'cancelled' ? (
        <div className="mt-4">
          <Alert variant="info" title="Order cancelled">
            Cancelled orders cannot be paid.
          </Alert>
        </div>
      ) : mockSession ? (
        <div className="mt-5 space-y-3">
          <div className="rounded-xl border border-accent-200 bg-accent-50/60 p-4">
            <p className="flex items-center gap-2 text-xs font-semibold text-accent-800">
              <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
              Local mock mode
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ink-600">
              No money moves here. Choose an outcome to exercise the same server verification a real
              gateway response uses.
            </p>
          </div>

          <Button
            fullWidth
            size="lg"
            onClick={() => void handleMockOutcome('success')}
            loading={verifyPayment.isPending}
            disabled={mockComplete.isPending}
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Simulate successful payment
          </Button>

          <Button
            fullWidth
            variant="secondary"
            onClick={() => void handleMockOutcome('failure')}
            loading={mockComplete.isPending}
            disabled={verifyPayment.isPending}
          >
            Simulate failed payment
          </Button>

          <button
            type="button"
            onClick={() => void handleMockCancel()}
            className="w-full text-center text-xs font-medium text-ink-500 underline-offset-4 transition hover:text-ink-800 hover:underline"
          >
            Cancel this attempt
          </button>
        </div>
      ) : (
        <div className="mt-5">
          <Button
            fullWidth
            size="lg"
            onClick={() => void beginPayment()}
            loading={startPayment.isPending}
            disabled={busy}
          >
            <CreditCard className="h-4 w-4" aria-hidden="true" />
            {wasFailed ? 'Retry payment' : 'Pay now'}
          </Button>
        </div>
      )}

      <p className="mt-5 flex items-start gap-2 border-t border-ink-200/80 pt-4 text-[11px] leading-relaxed text-ink-500">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-700" aria-hidden="true" />
        Card details never reach this app. The gateway returns a payment id and signature, and the
        server verifies them before changing the order.
      </p>
    </section>
  );
}
