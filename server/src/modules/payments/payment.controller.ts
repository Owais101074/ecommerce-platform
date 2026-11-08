import type { Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError';
import { sendSuccess } from '../../utils/ApiResponse';
import * as paymentService from './payment.service';
import type {
  AbandonPaymentInput,
  MockCompleteInput,
  StartPaymentInput,
  VerifyPaymentInput,
} from './payment.validation';

function currentUserId(req: Request): string {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required');
  }

  return req.user.id;
}

export async function start(req: Request, res: Response): Promise<void> {
  const input = req.body as StartPaymentInput;
  const payment = await paymentService.startPayment(currentUserId(req), input.orderId);
  sendSuccess(res, 200, 'Payment started', { payment });
}

export async function verify(req: Request, res: Response): Promise<void> {
  const payment = await paymentService.verifyPayment(
    currentUserId(req),
    req.body as VerifyPaymentInput,
  );
  sendSuccess(res, 200, 'Payment verified', { payment });
}

export async function abandon(req: Request, res: Response): Promise<void> {
  const input = req.body as AbandonPaymentInput;
  const payment = await paymentService.abandonPayment(currentUserId(req), input.orderId);
  sendSuccess(res, 200, 'Payment abandoned', { payment });
}

export async function mockComplete(req: Request, res: Response): Promise<void> {
  const result = await paymentService.mockCompletePayment(
    currentUserId(req),
    req.body as MockCompleteInput,
  );
  sendSuccess(res, 200, 'Mock payment completed', result);
}

export async function webhook(req: Request, res: Response): Promise<void> {
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
  const signature = req.get('x-razorpay-signature') ?? '';
  const result = await paymentService.handleWebhookEvent(rawBody, signature);
  sendSuccess(res, 200, 'Webhook received', result);
}
