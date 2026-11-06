import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate, validateQuery } from '../../middleware/validate';
import * as orderController from './order.controller';
import { orderListQuerySchema, placeOrderSchema, quoteSchema } from './order.validation';

const router = Router();

router.use(authenticate);

router.post('/quote', validate(quoteSchema), orderController.quote);
router.post('/', validate(placeOrderSchema), orderController.place);
router.get('/', validateQuery(orderListQuerySchema), orderController.list);
router.get('/:id', orderController.detail);

export default router;
