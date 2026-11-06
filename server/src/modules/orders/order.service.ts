import { randomBytes } from 'node:crypto';
import { ApiError } from '../../utils/ApiError';
import { Address } from '../addresses/address.model';
import type { AddressDocument } from '../addresses/address.model';
import * as cartService from '../cart/cart.service';
import { Product } from '../products/product.model';
import { resolveCoupon } from './coupon.service';
import { calculateOrderPricing } from './order.pricing';
import { toOrderDTO } from './order.mapper';
import { Order } from './order.model';
import type { IOrderAddress, OrderDocument } from './order.model';
import type { CheckoutQuoteDTO, OrderDTO, OrderListResult } from './order.types';
import type { OrderListQuery, PlaceOrderInput } from './order.validation';

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
    });
  } catch (error) {
    await Promise.all(
      decremented.map((entry) =>
        Product.updateOne({ _id: entry.productId }, { $inc: { stock: entry.quantity } }),
      ),
    );

    throw error;
  }

  await cartService.clearCart(userId);

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
