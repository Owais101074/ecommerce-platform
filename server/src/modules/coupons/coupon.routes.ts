import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate, validateQuery } from '../../middleware/validate';
import * as couponController from './coupon.controller';
import {
  adminCouponListQuerySchema,
  createCouponSchema,
  updateCouponSchema,
  validateCouponSchema,
} from './coupon.validation';

const router = Router();

router.post('/validate', authenticate, validate(validateCouponSchema), couponController.validate);

router.get(
  '/',
  authenticate,
  authorize('admin'),
  validateQuery(adminCouponListQuerySchema),
  couponController.list,
);
router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate(createCouponSchema),
  couponController.create,
);
router.patch(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(updateCouponSchema),
  couponController.update,
);
router.delete('/:id', authenticate, authorize('admin'), couponController.remove);

export default router;
