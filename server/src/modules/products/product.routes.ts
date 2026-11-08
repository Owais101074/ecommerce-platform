import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate, validateQuery } from '../../middleware/validate';
import * as reviewController from '../reviews/review.controller';
import { createReviewSchema, reviewListQuerySchema } from '../reviews/review.validation';
import * as productController from './product.controller';
import {
  createProductSchema,
  productQuerySchema,
  updateProductSchema,
  updateStockSchema,
} from './product.validation';

const router = Router();

router.get('/', validateQuery(productQuerySchema), productController.list);
router.get('/:slug/reviews', validateQuery(reviewListQuerySchema), reviewController.listForProduct);
router.post('/:id/reviews', authenticate, validate(createReviewSchema), reviewController.create);
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
