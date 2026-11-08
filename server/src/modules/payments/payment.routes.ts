import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as paymentController from './payment.controller';
import {
  abandonPaymentSchema,
  mockCompleteSchema,
  startPaymentSchema,
  verifyPaymentSchema,
} from './payment.validation';

const router = Router();

router.use(authenticate);

router.post('/start', validate(startPaymentSchema), paymentController.start);
router.post('/verify', validate(verifyPaymentSchema), paymentController.verify);
router.post('/abandon', validate(abandonPaymentSchema), paymentController.abandon);
router.post('/mock/complete', validate(mockCompleteSchema), paymentController.mockComplete);

export default router;
