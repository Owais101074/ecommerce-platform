import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as categoryController from './category.controller';
import { createCategorySchema, updateCategorySchema } from './category.validation';

const router = Router();

router.get('/', categoryController.list);
router.get('/:slug', categoryController.getBySlug);

router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate(createCategorySchema),
  categoryController.create,
);
router.patch(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(updateCategorySchema),
  categoryController.update,
);
router.delete('/:id', authenticate, authorize('admin'), categoryController.remove);

export default router;
