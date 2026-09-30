import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { loginSchema, signupSchema } from '../validators/auth.validator.js';

const router = Router();

// POST /api/auth/signup - Register new user
router.post('/signup', validateBody(signupSchema), AuthController.signup);

// POST /api/auth/login - Login user
router.post('/login', validateBody(loginSchema), AuthController.login);

export default router;
