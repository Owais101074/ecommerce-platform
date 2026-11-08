import { Router } from 'express';
import * as paymentController from './payment.controller';

const router = Router();

router.post('/', paymentController.webhook);

export default router;
