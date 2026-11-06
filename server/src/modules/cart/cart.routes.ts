import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as cartController from './cart.controller';
import { addCartItemSchema, updateCartItemSchema } from './cart.validation';

const router = Router();

router.use(authenticate);

router.get('/', cartController.get);
router.post('/items', validate(addCartItemSchema), cartController.addItem);
router.patch('/items/:productId', validate(updateCartItemSchema), cartController.updateItem);
router.delete('/items/:productId', cartController.removeItem);
router.delete('/', cartController.clear);

export default router;
