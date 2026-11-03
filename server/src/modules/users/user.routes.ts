import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as userController from './user.controller';
import { changePasswordSchema, updateProfileSchema } from './user.validation';

const router = Router();

router.use(authenticate);

router.get('/me', userController.me);
router.patch('/me', validate(updateProfileSchema), userController.updateProfile);
router.patch('/me/password', validate(changePasswordSchema), userController.changePassword);

export default router;
