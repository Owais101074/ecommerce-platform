import type { OrderDocument } from './order.model';
import type { OrderDTO } from './order.types';

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
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}
