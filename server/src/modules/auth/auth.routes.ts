import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireCsrf } from '../../middleware/csrf';
import { validate } from '../../middleware/validate';
import * as authController from './auth.controller';
import { loginSchema, registerSchema } from './auth.validation';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', requireCsrf, authController.refresh);
router.post('/logout', requireCsrf, authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
