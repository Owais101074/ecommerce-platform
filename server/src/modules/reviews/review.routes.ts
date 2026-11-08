import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as reviewController from './review.controller';
import { updateReviewSchema } from './review.validation';

const router = Router();

router.patch('/:id', authenticate, validate(updateReviewSchema), reviewController.update);

export default router;
