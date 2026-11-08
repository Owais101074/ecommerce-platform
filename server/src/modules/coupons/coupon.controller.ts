import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/ApiResponse';
import * as couponService from './coupon.service';
import type {
  AdminCouponListQuery,
  CreateCouponInput,
  UpdateCouponInput,
  ValidateCouponInput,
} from './coupon.validation';

export async function validate(req: Request, res: Response): Promise<void> {
  const { code } = req.body as ValidateCouponInput;
  const coupon = await couponService.validateCoupon(req.user!.id, code);
  sendSuccess(res, 200, 'Coupon applied', { coupon });
}

export async function list(req: Request, res: Response): Promise<void> {
  const result = await couponService.listCoupons(req.validatedQuery as AdminCouponListQuery);
  sendSuccess(res, 200, 'Coupons fetched', { coupons: result.coupons }, result.meta);
}

export async function create(req: Request, res: Response): Promise<void> {
  const coupon = await couponService.createCoupon(req.body as CreateCouponInput);
  sendSuccess(res, 201, 'Coupon created', { coupon });
}

export async function update(req: Request, res: Response): Promise<void> {
  const coupon = await couponService.updateCoupon(
    req.params.id as string,
    req.body as UpdateCouponInput,
  );
  sendSuccess(res, 200, 'Coupon updated', { coupon });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await couponService.deleteCoupon(req.params.id as string);
  res.status(204).send();
}
