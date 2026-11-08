import type { OrderDocument } from './order.model';
import type {
  AdminOrderCustomerDTO,
  AdminOrderDTO,
  OrderDTO,
  OrderStatusEventDTO,
} from './order.types';

function buildStatusHistory(order: OrderDocument): OrderStatusEventDTO[] {
  const history: OrderStatusEventDTO[] = order.statusHistory?.length
    ? order.statusHistory.map((event) => ({
        status: event.status,
        at: event.at,
        note: event.note ?? null,
      }))
    : [];

  // Orders created before status history existed only have their current state.
  if (!history.some((event) => event.status === 'placed')) {
    history.unshift({ status: 'placed', at: order.createdAt, note: null });
  }

  if (!history.some((event) => event.status === order.status)) {
    history.push({ status: order.status, at: order.updatedAt, note: null });
  }

  return history;
}

export function toOrderDTO(order: OrderDocument): OrderDTO {
  return {
    id: order._id.toString(),
    orderNumber: order.orderNumber,
    items: order.items.map((item) => ({
      productId: item.productId.toString(),
      name: item.name,
      slug: item.slug,
      image: item.image ?? null,
      price: item.price,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
    address: {
      fullName: order.address.fullName,
      phone: order.address.phone,
      line1: order.address.line1,
      line2: order.address.line2 ?? null,
      city: order.address.city,
      state: order.address.state,
      pincode: order.address.pincode,
    },
    subtotal: order.subtotal,
    tax: order.tax,
    shipping: order.shipping,
    discount: order.discount,
    total: order.total,
    couponCode: order.couponCode ?? null,
    status: order.status,
    paymentStatus: order.paymentStatus,
    statusHistory: buildStatusHistory(order),
    tracking: order.tracking
      ? {
          carrier: order.tracking.carrier,
          trackingNumber: order.tracking.trackingNumber,
          updatedAt: order.tracking.updatedAt,
        }
      : null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export function toAdminOrderDTO(
  order: OrderDocument,
  customer: AdminOrderCustomerDTO,
): AdminOrderDTO {
  return { ...toOrderDTO(order), customer };
}
