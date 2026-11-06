import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as addressController from './address.controller';
import { createAddressSchema, updateAddressSchema } from './address.validation';

const router = Router();

router.use(authenticate);

router.get('/', addressController.list);
router.post('/', validate(createAddressSchema), addressController.create);
router.patch('/:id/default', addressController.setDefault);
router.patch('/:id', validate(updateAddressSchema), addressController.update);
router.delete('/:id', addressController.remove);

export default router;
