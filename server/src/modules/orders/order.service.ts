import { randomBytes } from 'node:crypto';
import { invalidateProductCache } from '../../infra/cache';
import { ApiError } from '../../utils/ApiError';
import { logger } from '../../utils/logger';
import { Address } from '../addresses/address.model';
import type { AddressDocument } from '../addresses/address.model';
import { User } from '../auth/auth.model';
import * as cartService from '../cart/cart.service';
import { claimCoupon, releaseCoupon, resolveCoupon } from '../coupons/coupon.service';
import { notifyOrder } from '../notifications/order.notifications';
import * as paymentService from '../payments/payment.service';
import { Product } from '../products/product.model';
import { calculateOrderPricing } from './order.pricing';
import { toAdminOrderDTO, toOrderDTO } from './order.mapper';
import { Order } from './order.model';
import type { IOrderAddress, IOrderItem, IOrderStatusEvent, OrderDocument } from './order.model';
import type {
  AdminOrderDTO,
  AdminOrderListResult,
  AdminStatusResult,
  CancelOrderResult,
  CheckoutQuoteDTO,
  OrderDTO,
  OrderListResult,
  OrderStatus,
} from './order.types';
import type {
  AdminOrderListQuery,
  AdminUpdateOrderStatusInput,
  OrderListQuery,
  PlaceOrderInput,
} from './order.validation';

const CANCELLABLE_STATUSES: OrderStatus[] = ['placed', 'confirmed'];

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const random = randomBytes(3).toString('hex').toUpperCase();
  return `ORD-${date}-${random}`;
}

function toAddressSnapshot(address: AddressDocument): IOrderAddress {
  return {
    fullName: address.fullName,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2 ?? null,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
  };
}

function statusEvent(status: OrderStatus, note: string | null = null): IOrderStatusEvent {
  return { status, at: new Date(), note };
}

async function restoreStock(items: IOrderItem[]): Promise<void> {
  await Promise.all(
    items.map((item) =>
      Product.updateOne({ _id: item.productId }, { $inc: { stock: item.quantity } }),
    ),
  );
}

export async function getCheckoutQuote(
  userId: string,
  couponCode: string | undefined,
): Promise<CheckoutQuoteDTO> {
  const cart = await cartService.getCart(userId);

  if (cart.items.length === 0) {
    throw new ApiError(400, 'Your cart is empty');
  }

  const coupon = await resolveCoupon(couponCode, cart.subtotal);
  const pricing = calculateOrderPricing(cart.subtotal, coupon.discount);

  return {
    ...pricing,
    itemCount: cart.itemCount,
    priceChanged: cart.priceChanged,
    couponCode: coupon.code,
  };
}

export async function placeOrder(userId: string, input: PlaceOrderInput): Promise<OrderDTO> {
  const cart = await cartService.getCart(userId);

  if (cart.items.length === 0) {
    throw new ApiError(400, 'Your cart is empty');
  }

  const address = await Address.findOne({ _id: input.addressId, userId });

  if (!address) {
    throw new ApiError(404, 'Address not found');
  }

  const coupon = await resolveCoupon(input.couponCode, cart.subtotal);
  const pricing = calculateOrderPricing(cart.subtotal, coupon.discount);

  if (coupon.code) {
    await claimCoupon(coupon.code);
  }

  const decremented: { productId: string; quantity: number }[] = [];
  let order: OrderDocument;

  try {
    for (const item of cart.items) {
      const result = await Product.updateOne(
        { _id: item.product.id, isActive: true, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
      );

      if (result.modifiedCount === 0) {
        throw new ApiError(
          409,
          `${item.product.name} no longer has ${item.quantity} units in stock`,
        );
      }

      decremented.push({
        productId: item.product.id,
        quantity: item.quantity,
      });
    }

    order = await Order.create({
      userId,
      orderNumber: generateOrderNumber(),
      items: cart.items.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        image: item.product.images[0] ?? null,
        price: item.priceAtAdd,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      })),
      address: toAddressSnapshot(address),
      ...pricing,
      couponCode: coupon.code,
      statusHistory: [statusEvent('placed')],
    });
  } catch (error) {
    await Promise.all(
      decremented.map((entry) =>
        Product.updateOne({ _id: entry.productId }, { $inc: { stock: entry.quantity } }),
      ),
    );

    if (coupon.code) {
      await releaseCoupon(coupon.code);
    }

    throw error;
  }

  await cartService.clearCart(userId);
  await invalidateProductCache();
  await notifyOrder(order, 'placed');

  return toOrderDTO(order);
}

export async function listOrders(userId: string, query: OrderListQuery): Promise<OrderListResult> {
  const filter = { userId };
  const skip = (query.page - 1) * query.limit;

  const [total, orders] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
  ]);

  return {
    orders: orders.map(toOrderDTO),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
    },
  };
}

export async function getOrder(userId: string, orderId: string): Promise<OrderDTO> {
  const order = await Order.findOne({ _id: orderId, userId });

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  return toOrderDTO(order);
}

async function cancelOrderDocument(
  order: OrderDocument,
): Promise<{ order: OrderDocument; refundPending: boolean }> {
  if (order.status === 'shipped' || order.status === 'delivered') {
    throw new ApiError(409, `Orders that are already ${order.status} cannot be cancelled`);
  }

  let cancelled = order;

  if (CANCELLABLE_STATUSES.includes(order.status)) {
    const changed = await Order.findOneAndUpdate(
      { _id: order._id, status: { $in: CANCELLABLE_STATUSES } },
      {
        $set: { status: 'cancelled', tracking: null },
        $push: { statusHistory: statusEvent('cancelled') },
      },
      { new: true },
    );

    if (!changed) {
      const current = await Order.findById(order._id);

      if (!current) {
        throw new ApiError(404, 'Order not found');
      }

      if (current.status === 'shipped' || current.status === 'delivered') {
        throw new ApiError(409, `Orders that are already ${current.status} cannot be cancelled`);
      }

      if (current.status !== 'cancelled') {
        throw new ApiError(409, 'Order could not be cancelled');
      }

      cancelled = current;
    } else {
      cancelled = changed;
      await restoreStock(cancelled.items);
      await invalidateProductCache();

      // A cancelled order should not keep burning a limited coupon run.
      if (cancelled.couponCode) {
        await releaseCoupon(cancelled.couponCode);
      }

      await notifyOrder(cancelled, 'cancelled');
    }
  }

  let refundPending = false;

  if (cancelled.paymentStatus === 'paid') {
    try {
      const refund = await paymentService.refundOrderPayment(cancelled._id.toString());

      if (refund) {
        cancelled = (await Order.findById(cancelled._id)) ?? cancelled;
      } else {
        refundPending = true;
      }
    } catch (error) {
      // The order is already cancelled, so surface a pending refund instead of failing the request.
      logger.error('orders.refund-failed', { orderId: cancelled._id.toString(), err: error });
      refundPending = true;
    }
  }

  return { order: cancelled, refundPending };
}

export async function cancelOrder(userId: string, orderId: string): Promise<CancelOrderResult> {
  const order = await Order.findOne({ _id: orderId, userId });

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  const result = await cancelOrderDocument(order);

  return { order: toOrderDTO(result.order), refundPending: result.refundPending };
}

async function toAdminOrder(order: OrderDocument): Promise<AdminOrderDTO> {
  const user = await User.findById(order.userId).select('name email');

  return toAdminOrderDTO(order, {
    id: order.userId.toString(),
    name: user?.name ?? 'Unknown customer',
    email: user?.email ?? '',
  });
}

export async function listAdminOrders(query: AdminOrderListQuery): Promise<AdminOrderListResult> {
  const filter: Record<string, unknown> = {};

  if (query.status) {
    filter.status = query.status;
  }

  if (query.userId) {
    filter.userId = query.userId;
  }

  const skip = (query.page - 1) * query.limit;
  const [total, orders] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
  ]);

  const users = await User.find({
    _id: { $in: orders.map((order) => order.userId) },
  }).select('name email');
  const usersById = new Map(users.map((user) => [user._id.toString(), user]));

  return {
    orders: orders.map((order) => {
      const user = usersById.get(order.userId.toString());

      return toAdminOrderDTO(order, {
        id: order.userId.toString(),
        name: user?.name ?? 'Unknown customer',
        email: user?.email ?? '',
      });
    }),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
    },
  };
}

export async function getAdminOrder(orderId: string): Promise<AdminOrderDTO> {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  return toAdminOrder(order);
}

export async function updateOrderStatus(
  orderId: string,
  input: AdminUpdateOrderStatusInput,
): Promise<AdminStatusResult> {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (!ALLOWED_TRANSITIONS[order.status].includes(input.status)) {
    throw new ApiError(409, `Order cannot move from ${order.status} to ${input.status}`);
  }

  if (input.status === 'confirmed' && order.paymentStatus !== 'paid') {
    throw new ApiError(409, 'Only paid orders can be confirmed');
  }

  let updated: OrderDocument;
  let refundPending = false;

  if (input.status === 'cancelled') {
    const result = await cancelOrderDocument(order);
    updated = result.order;
    refundPending = result.refundPending;
  } else {
    const setFields: Record<string, unknown> = { status: input.status };

    if (input.status === 'shipped' && input.carrier && input.trackingNumber) {
      setFields.tracking = {
        carrier: input.carrier,
        trackingNumber: input.trackingNumber,
        updatedAt: new Date(),
      };
    }

    const changed = await Order.findOneAndUpdate(
      { _id: order._id, status: order.status },
      {
        $set: setFields,
        $push: { statusHistory: statusEvent(input.status, input.note ?? null) },
      },
      { new: true },
    );

    if (!changed) {
      throw new ApiError(409, 'Order changed in the meantime; refresh and try again');
    }

    updated = changed;

    if (input.status === 'shipped' || input.status === 'delivered') {
      await notifyOrder(updated, input.status);
    }
  }

  return { order: await toAdminOrder(updated), refundPending };
}
