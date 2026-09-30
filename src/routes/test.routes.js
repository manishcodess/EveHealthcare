import { Router } from 'express';
import { TestController } from '../controllers/test.controller.js';
import { validateParams, validateQuery } from '../middleware/validate.middleware.js';
import { idParamSchema } from '../validators/common.validator.js';
import { getTestsQuerySchema } from '../validators/test.validator.js';

const router = Router();

// GET /api/tests - Retrieve all diagnostic tests
router.get('/', validateQuery(getTestsQuerySchema), TestController.getAllTests);

// GET /api/tests/:id - Retrieve diagnostic test by ID
router.get('/:id', validateParams(idParamSchema), TestController.getTestById);

export default router;
