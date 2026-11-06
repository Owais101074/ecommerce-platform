import type { ApiMeta, ApiSuccess } from '@/types/api';
import type { CheckoutQuote, Order, OrderList } from '@/types/order';
import { http } from './http';

export async function fetchCheckoutQuote(couponCode?: string): Promise<CheckoutQuote> {
  const { data } = await http.post<ApiSuccess<{ quote: CheckoutQuote }>>('/orders/quote', {
    couponCode,
  });
  return data.data.quote;
}

export async function placeOrderRequest(input: {
  addressId: string;
  couponCode?: string;
}): Promise<Order> {
  const { data } = await http.post<ApiSuccess<{ order: Order }>>('/orders', input);
  return data.data.order;
}

export async function fetchOrders(page = 1, limit = 10): Promise<OrderList> {
  const { data } = await http.get<ApiSuccess<{ orders: Order[] }>>('/orders', {
    params: { page, limit },
  });
  const meta: ApiMeta = data.meta ?? {
    page,
    limit,
    total: data.data.orders.length,
    totalPages: 1,
  };

  return { orders: data.data.orders, meta };
}

export async function fetchOrder(orderId: string): Promise<Order> {
  const { data } = await http.get<ApiSuccess<{ order: Order }>>(`/orders/${orderId}`);
  return data.data.order;
}
