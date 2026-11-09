import { enqueueEmail } from '../../infra/queue';
import { logger } from '../../utils/logger';
import { User } from '../auth/auth.model';
import type { OrderDocument } from '../orders/order.model';
import { buildOrderEmail } from './mail.templates';
import type { OrderEmailKind } from './mail.templates';

/**
 * Notification failures are logged, never thrown: an order must not fail
 * because a mail provider or queue is temporarily unavailable.
 */
export async function notifyOrder(order: OrderDocument, kind: OrderEmailKind): Promise<void> {
  try {
    const user = await User.findById(order.userId).select('name email');

    if (!user?.email) {
      logger.warn('notifications.missing-email', { orderId: order._id.toString(), kind });
      return;
    }

    const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);
    const message = buildOrderEmail({
      kind,
      to: user.email,
      customerName: user.name,
      orderNumber: order.orderNumber,
      totalPaise: order.total,
      itemCount,
      tracking: order.tracking
        ? { carrier: order.tracking.carrier, trackingNumber: order.tracking.trackingNumber }
        : null,
    });

    await enqueueEmail(message);
  } catch (error) {
    logger.warn('notifications.order-failed', {
      orderId: order._id.toString(),
      kind,
      err: error,
    });
  }
}
