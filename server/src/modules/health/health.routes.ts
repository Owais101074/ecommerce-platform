import { Router } from 'express';
import { getHealth, getLiveness } from './health.controller';

const router = Router();

router.get('/live', getLiveness);
router.get('/', getHealth);

export default router;
