import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate, validateQuery } from '../../middleware/validate';
import * as productController from './product.controller';
import {
  createProductSchema,
  productQuerySchema,
  updateProductSchema,
  updateStockSchema,
} from './product.validation';

const router = Router();

router.get('/', validateQuery(productQuerySchema), productController.list);
router.get('/:slug', productController.getBySlug);

router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate(createProductSchema),
  productController.create,
);
router.patch(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(updateProductSchema),
  productController.update,
);
router.patch(
  '/:id/stock',
  authenticate,
  authorize('admin'),
  validate(updateStockSchema),
  productController.updateStock,
);
router.delete('/:id', authenticate, authorize('admin'), productController.remove);

export default router;
