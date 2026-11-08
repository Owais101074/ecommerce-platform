import type { AdminOrder, OrderStatus } from './order';

export interface AdminLowStockProduct {
  id: string;
  name: string;
  slug: string;
  stock: number;
  price: number;
}

export interface AdminTopProduct {
  productId: string;
  name: string;
  slug: string;
  unitsSold: number;
  revenue: number;
}

export interface AdminDailySales {
  date: string;
  revenue: number;
  orders: number;
}

export interface AdminStats {
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
  lowStockProducts: AdminLowStockProduct[];
  topProducts: AdminTopProduct[];
  recentOrders: AdminOrder[];
  dailySales: AdminDailySales[];
}

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
}

export interface AdminCustomerDetail extends AdminCustomer {
  recentOrders: AdminOrder[];
}

export interface AdminCustomerList {
  customers: AdminCustomer[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
