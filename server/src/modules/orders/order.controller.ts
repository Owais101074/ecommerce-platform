import type { Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError';
import { sendSuccess } from '../../utils/ApiResponse';
import * as orderService from './order.service';
import type { OrderListQuery, PlaceOrderInput, QuoteInput } from './order.validation';

function currentUserId(req: Request): string {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required');
  }

  return req.user.id;
}

export async function quote(req: Request, res: Response): Promise<void> {
  const input = req.body as QuoteInput;
  const quoteResult = await orderService.getCheckoutQuote(currentUserId(req), input.couponCode);
  sendSuccess(res, 200, 'Checkout quote calculated', { quote: quoteResult });
}

export async function place(req: Request, res: Response): Promise<void> {
  const order = await orderService.placeOrder(currentUserId(req), req.body as PlaceOrderInput);
  sendSuccess(res, 201, 'Order placed', { order });
}

export async function list(req: Request, res: Response): Promise<void> {
  const result = await orderService.listOrders(
    currentUserId(req),
    req.validatedQuery as OrderListQuery,
  );
  sendSuccess(res, 200, 'Orders fetched', { orders: result.orders }, result.meta);
}

export async function detail(req: Request, res: Response): Promise<void> {
  const order = await orderService.getOrder(currentUserId(req), req.params.id as string);
  sendSuccess(res, 200, 'Order fetched', { order });
}
