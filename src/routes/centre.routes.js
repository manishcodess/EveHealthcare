import { Router } from 'express';
import { CentreController } from '../controllers/centre.controller.js';
import { validateParams, validateQuery } from '../middleware/validate.middleware.js';
import { getCentresQuerySchema } from '../validators/centre.validator.js';
import { idParamSchema } from '../validators/common.validator.js';

const router = Router();

// GET /api/centres - Retrieve all diagnostic centres
router.get('/', validateQuery(getCentresQuerySchema), CentreController.getAllCentres);

// GET /api/centres/:id - Retrieve diagnostic centre by ID
router.get('/:id', validateParams(idParamSchema), CentreController.getCentreById);

export default router;
