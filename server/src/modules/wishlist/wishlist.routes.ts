import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as wishlistController from './wishlist.controller';

const router = Router();

router.use(authenticate);

router.get('/', wishlistController.list);
router.post('/:productId', wishlistController.add);
router.delete('/:productId', wishlistController.remove);

export default router;
