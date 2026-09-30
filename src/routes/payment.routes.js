import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createPaymentSchema, webhookSchema } from '../validators/payment.validator.js';

const router = Router();

// POST /webhook - Payment webhook endpoint (receives asynchronous events from payment provider)
router.post('/webhook', validateBody(webhookSchema), PaymentController.processWebhook);

// POST / - Direct mock payment processing endpoint (requires authentication)
router.post('/', requireAuth, validateBody(createPaymentSchema), PaymentController.processPayment);

export default router;
