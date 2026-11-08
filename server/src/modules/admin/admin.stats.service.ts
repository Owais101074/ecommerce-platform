import type { Types } from 'mongoose';
import { User } from '../auth/auth.model';
import { Coupon } from '../coupons/coupon.model';
import { Order } from '../orders/order.model';
import { toAdminOrderDTO } from '../orders/order.mapper';
import type { AdminOrderDTO, OrderStatus } from '../orders/order.types';
import { Product } from '../products/product.model';
import type {
  AdminDailySalesDTO,
  AdminLowStockProductDTO,
  AdminStatsDTO,
  AdminTopProductDTO,
} from './admin.types';

const LOW_STOCK_THRESHOLD = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

interface RevenueAggregate {
  total: number;
  last30Days: number;
  today: number;
}

interface StatusAggregate {
  _id: OrderStatus;
  count: number;
}

interface DailyAggregate {
  _id: string;
  revenue: number;
  orders: number;
}

interface TopProductAggregate {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  unitsSold: number;
  revenue: number;
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

async function loadRecentOrders(limit: number): Promise<AdminOrderDTO[]> {
  const orders = await Order.find().sort({ createdAt: -1 }).limit(limit);
  const users = await User.find({ _id: { $in: orders.map((order) => order.userId) } }).select(
    'name email',
  );
  const usersById = new Map(users.map((user) => [user._id.toString(), user]));

  return orders.map((order) => {
    const user = usersById.get(order.userId.toString());

    return toAdminOrderDTO(order, {
      id: order.userId.toString(),
      name: user?.name ?? 'Unknown customer',
      email: user?.email ?? '',
    });
  });
}

async function loadLowStockProducts(): Promise<AdminLowStockProductDTO[]> {
  const products = await Product.find({ isActive: true, stock: { $lte: LOW_STOCK_THRESHOLD } })
    .sort({ stock: 1, name: 1 })
    .limit(8)
    .select('name slug stock price');

  return products.map((product) => ({
    id: product._id.toString(),
    name: product.name,
    slug: product.slug,
    stock: product.stock,
    price: product.price,
  }));
}

async function loadTopProducts(): Promise<AdminTopProductDTO[]> {
  const rows = await Order.aggregate<TopProductAggregate>([
    { $match: { status: { $ne: 'cancelled' } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        name: { $first: '$items.name' },
        slug: { $first: '$items.slug' },
        unitsSold: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.lineTotal' },
      },
    },
    { $sort: { unitsSold: -1, revenue: -1 } },
    { $limit: 5 },
  ]);

  return rows.map((row) => ({
    productId: row._id.toString(),
    name: row.name,
    slug: row.slug,
    unitsSold: row.unitsSold,
    revenue: row.revenue,
  }));
}

async function loadDailySales(seriesStart: Date): Promise<AdminDailySalesDTO[]> {
  const rows = await Order.aggregate<DailyAggregate>([
    { $match: { paymentStatus: 'paid', createdAt: { $gte: seriesStart } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' },
        orders: { $sum: 1 },
      },
    },
  ]);
  const rowsByDate = new Map(rows.map((row) => [row._id, row]));

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(seriesStart.getTime() + index * DAY_MS).toISOString().slice(0, 10);
    const row = rowsByDate.get(date);

    return { date, revenue: row?.revenue ?? 0, orders: row?.orders ?? 0 };
  });
}

export async function getAdminStats(): Promise<AdminStatsDTO> {
  const now = new Date();
  const todayStart = startOfUtcDay(now);
  const last30Days = new Date(now.getTime() - 30 * DAY_MS);
  const seriesStart = new Date(todayStart.getTime() - 6 * DAY_MS);

  const [
    revenueRows,
    statusRows,
    totalOrders,
    pendingPayments,
    customerTotal,
    customerActive,
    customerNew,
    productTotal,
    lowStockCount,
    outOfStock,
    couponTotal,
    couponActive,
    lowStockProducts,
    topProducts,
    recentOrders,
    dailySales,
  ] = await Promise.all([
    Order.aggregate<RevenueAggregate>([
      { $match: { paymentStatus: 'paid' } },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' },
          last30Days: {
            $sum: { $cond: [{ $gte: ['$createdAt', last30Days] }, '$total', 0] },
          },
          today: { $sum: { $cond: [{ $gte: ['$createdAt', todayStart] }, '$total', 0] } },
        },
      },
    ]),
    Order.aggregate<StatusAggregate>([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.countDocuments(),
    Order.countDocuments({ paymentStatus: 'pending' }),
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'customer', isActive: true }),
    User.countDocuments({ role: 'customer', createdAt: { $gte: last30Days } }),
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: true, stock: { $lte: LOW_STOCK_THRESHOLD } }),
    Product.countDocuments({ isActive: true, stock: 0 }),
    Coupon.countDocuments(),
    Coupon.countDocuments({
      isActive: true,
      startsAt: { $lte: now },
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    }),
    loadLowStockProducts(),
    loadTopProducts(),
    loadRecentOrders(5),
    loadDailySales(seriesStart),
  ]);

  const byStatus: Record<OrderStatus, number> = {
    placed: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };

  for (const row of statusRows) {
    byStatus[row._id] = row.count;
  }

  const revenue = revenueRows[0] ?? { total: 0, last30Days: 0, today: 0 };

  return {
    revenue: {
      total: revenue.total,
      last30Days: revenue.last30Days,
      today: revenue.today,
    },
    orders: {
      total: totalOrders,
      pendingPayments,
      byStatus,
    },
    customers: {
      total: customerTotal,
      active: customerActive,
      newLast30Days: customerNew,
    },
    products: {
      total: productTotal,
      lowStock: lowStockCount,
      outOfStock,
    },
    coupons: {
      total: couponTotal,
      active: couponActive,
    },
    lowStockProducts,
    topProducts,
    recentOrders,
    dailySales,
  };
}
