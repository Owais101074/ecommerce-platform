import type { AdminOrderDTO, OrderStatus } from '../orders/order.types';

export interface AdminLowStockProductDTO {
  id: string;
  name: string;
  slug: string;
  stock: number;
  price: number;
}

export interface AdminTopProductDTO {
  productId: string;
  name: string;
  slug: string;
  unitsSold: number;
  revenue: number;
}

export interface AdminDailySalesDTO {
  date: string;
  revenue: number;
  orders: number;
}

export interface AdminStatsDTO {
  revenue: {
    total: number;
    last30Days: number;
    today: number;
  };
  orders: {
    total: number;
    pendingPayments: number;
    byStatus: Record<OrderStatus, number>;
  };
  customers: {
    total: number;
    active: number;
    newLast30Days: number;
  };
  products: {
    total: number;
    lowStock: number;
    outOfStock: number;
  };
  coupons: {
    total: number;
    active: number;
  };
  lowStockProducts: AdminLowStockProductDTO[];
  topProducts: AdminTopProductDTO[];
  recentOrders: AdminOrderDTO[];
  dailySales: AdminDailySalesDTO[];
}

export interface AdminCustomerDTO {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: Date | null;
}

export interface AdminCustomerDetailDTO extends AdminCustomerDTO {
  recentOrders: AdminOrderDTO[];
}

export interface AdminCustomerListResult {
  customers: AdminCustomerDTO[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
