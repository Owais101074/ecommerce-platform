import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/ApiResponse';
import * as orderService from '../orders/order.service';
import type { AdminOrderListQuery, AdminUpdateOrderStatusInput } from '../orders/order.validation';

export async function listOrders(req: Request, res: Response): Promise<void> {
  const result = await orderService.listAdminOrders(req.validatedQuery as AdminOrderListQuery);
  sendSuccess(res, 200, 'Orders fetched', { orders: result.orders }, result.meta);
}

export async function orderDetail(req: Request, res: Response): Promise<void> {
  const order = await orderService.getAdminOrder(req.params.id as string);
  sendSuccess(res, 200, 'Order fetched', { order });
}

export async function updateStatus(req: Request, res: Response): Promise<void> {
  const result = await orderService.updateOrderStatus(
    req.params.id as string,
    req.body as AdminUpdateOrderStatusInput,
  );
  sendSuccess(
    res,
    200,
    result.refundPending ? 'Order cancelled; refund is pending' : 'Order status updated',
    result,
  );
}
