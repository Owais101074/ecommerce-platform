import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import * as uploadController from './upload.controller';
import { singleProductImage } from './upload.middleware';

const router = Router();

router.post(
  '/product-image',
  authenticate,
  authorize('admin'),
  singleProductImage,
  uploadController.uploadProductImage,
);

export default router;
