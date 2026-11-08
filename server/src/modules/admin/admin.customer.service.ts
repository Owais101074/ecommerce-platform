import type { Types } from 'mongoose';
import { ApiError } from '../../utils/ApiError';
import { User } from '../auth/auth.model';
import type { UserDocument } from '../auth/auth.model';
import { Order } from '../orders/order.model';
import { toAdminOrderDTO } from '../orders/order.mapper';
import type {
  AdminCustomerDTO,
  AdminCustomerDetailDTO,
  AdminCustomerListResult,
} from './admin.types';
import type { AdminCustomerListQuery } from './admin.customer.validation';

interface CustomerOrderStats {
  _id: Types.ObjectId;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: Date;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function loadOrderStats(userIds: Types.ObjectId[]): Promise<Map<string, CustomerOrderStats>> {
  if (userIds.length === 0) {
    return new Map();
  }

  const rows = await Order.aggregate<CustomerOrderStats>([
    { $match: { userId: { $in: userIds } } },
    {
      $group: {
        _id: '$userId',
        orderCount: { $sum: 1 },
        totalSpent: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$total', 0] },
        },
        lastOrderAt: { $max: '$createdAt' },
      },
    },
  ]);

  return new Map(rows.map((row) => [row._id.toString(), row]));
}

function toCustomerDTO(
  user: UserDocument,
  stats: CustomerOrderStats | undefined,
): AdminCustomerDTO {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    isActive: user.isActive,
    createdAt: user.createdAt,
    orderCount: stats?.orderCount ?? 0,
    totalSpent: stats?.totalSpent ?? 0,
    lastOrderAt: stats?.lastOrderAt ?? null,
  };
}

export async function listCustomers(
  query: AdminCustomerListQuery,
): Promise<AdminCustomerListResult> {
  const filter: Record<string, unknown> = { role: 'customer' };

  if (query.search) {
    const pattern = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ name: pattern }, { email: pattern }];
  }

  if (query.status) {
    filter.isActive = query.status === 'active';
  }

  const skip = (query.page - 1) * query.limit;
  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
  ]);
  const stats = await loadOrderStats(users.map((user) => user._id));

  return {
    customers: users.map((user) => toCustomerDTO(user, stats.get(user._id.toString()))),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
    },
  };
}

export async function getCustomer(id: string): Promise<AdminCustomerDetailDTO> {
  const user = await User.findOne({ _id: id, role: 'customer' });

  if (!user) {
    throw new ApiError(404, 'Customer not found');
  }

  const [stats, orders] = await Promise.all([
    loadOrderStats([user._id]),
    Order.find({ userId: user._id }).sort({ createdAt: -1 }).limit(5),
  ]);
  const customer = toCustomerDTO(user, stats.get(user._id.toString()));

  return {
    ...customer,
    recentOrders: orders.map((order) =>
      toAdminOrderDTO(order, {
        id: customer.id,
        name: customer.name,
        email: customer.email,
      }),
    ),
  };
}

export async function updateCustomerStatus(
  id: string,
  isActive: boolean,
): Promise<AdminCustomerDTO> {
  const user = await User.findOne({ _id: id, role: 'customer' });

  if (!user) {
    throw new ApiError(404, 'Customer not found');
  }

  user.isActive = isActive;

  if (!isActive) {
    // Deactivation ends every refresh session immediately.
    user.refreshTokenHash = null;
    user.refreshTokenExpiresAt = null;
  }

  await user.save();

  const stats = await loadOrderStats([user._id]);

  return toCustomerDTO(user, stats.get(user._id.toString()));
}
