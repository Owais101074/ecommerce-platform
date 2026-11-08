import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate, validateQuery } from '../../middleware/validate';
import {
  adminOrderListQuerySchema,
  adminUpdateOrderStatusSchema,
} from '../orders/order.validation';
import uploadRoutes from '../uploads/upload.routes';
import * as adminController from './admin.controller';
import * as adminCustomerController from './admin.customer.controller';
import {
  adminCustomerListQuerySchema,
  adminCustomerStatusSchema,
} from './admin.customer.validation';
import * as adminOrderController from './admin.order.controller';
import * as adminStatsController from './admin.stats.controller';

const router = Router();

router.get('/ping', authenticate, authorize('admin'), adminController.ping);

router.get('/stats', authenticate, authorize('admin'), adminStatsController.stats);

router.get(
  '/customers',
  authenticate,
  authorize('admin'),
  validateQuery(adminCustomerListQuerySchema),
  adminCustomerController.listCustomers,
);
router.get(
  '/customers/:id',
  authenticate,
  authorize('admin'),
  adminCustomerController.customerDetail,
);
router.patch(
  '/customers/:id/status',
  authenticate,
  authorize('admin'),
  validate(adminCustomerStatusSchema),
  adminCustomerController.updateStatus,
);

router.use('/uploads', uploadRoutes);

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
