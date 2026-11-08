import type { ApiMeta, ApiSuccess } from '@/types/api';
import type { AdminOrder, AdminOrderList, AdminStatusResult, OrderStatus } from '@/types/order';
import { http } from './http';

export interface AdminOrderFilters {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  userId?: string;
}

export interface AdminStatusUpdate {
  status: Exclude<OrderStatus, 'placed'>;
  note?: string;
  carrier?: string;
  trackingNumber?: string;
}

export async function fetchAdminOrders(filters: AdminOrderFilters = {}): Promise<AdminOrderList> {
  const { data } = await http.get<ApiSuccess<{ orders: AdminOrder[] }>>('/admin/orders', {
    params: filters,
  });
  const meta: ApiMeta = data.meta ?? {
    page: filters.page ?? 1,
    limit: filters.limit ?? 10,
    total: data.data.orders.length,
    totalPages: 1,
  };

  return { orders: data.data.orders, meta };
}

export async function fetchAdminOrder(orderId: string): Promise<AdminOrder> {
  const { data } = await http.get<ApiSuccess<{ order: AdminOrder }>>(`/admin/orders/${orderId}`);
  return data.data.order;
}

export async function updateAdminOrderStatus(
  orderId: string,
  input: AdminStatusUpdate,
): Promise<AdminStatusResult> {
  const { data } = await http.patch<ApiSuccess<AdminStatusResult>>(
    `/admin/orders/${orderId}/status`,
    input,
  );
  return data.data;
}
