import { Badge } from '@/components/ui/Badge';
import type { OrderStatus, PaymentStatus } from '@/types/order';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand';

const orderTones: Record<OrderStatus, Tone> = {
  placed: 'warning',
  confirmed: 'brand',
  shipped: 'brand',
  delivered: 'success',
  cancelled: 'danger',
};

const paymentTones: Record<PaymentStatus, Tone> = {
  pending: 'warning',
  paid: 'success',
  failed: 'danger',
  refunded: 'neutral',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge tone={orderTones[status]} dot>
      {status}
    </Badge>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge tone={paymentTones[status]}>Payment {status}</Badge>;
}
