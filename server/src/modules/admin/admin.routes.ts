import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import * as adminController from './admin.controller';

const router = Router();

router.get('/ping', authenticate, authorize('admin'), adminController.ping);

export default router;
