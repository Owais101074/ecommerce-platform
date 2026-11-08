import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate, validateQuery } from '../../middleware/validate';
import {
  adminOrderListQuerySchema,
  adminUpdateOrderStatusSchema,
} from '../orders/order.validation';
import * as adminController from './admin.controller';
import * as adminOrderController from './admin.order.controller';

const router = Router();

router.get('/ping', authenticate, authorize('admin'), adminController.ping);

router.get(
  '/orders',
  authenticate,
  authorize('admin'),
  validateQuery(adminOrderListQuerySchema),
  adminOrderController.listOrders,
);
router.get('/orders/:id', authenticate, authorize('admin'), adminOrderController.orderDetail);
router.patch(
  '/orders/:id/status',
  authenticate,
  authorize('admin'),
  validate(adminUpdateOrderStatusSchema),
  adminOrderController.updateStatus,
);

export default router;
