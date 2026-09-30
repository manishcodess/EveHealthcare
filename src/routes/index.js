import { Router } from 'express';
import { sendSuccess } from '../utils/response.js';
import authRoutes from './auth.routes.js';
import bookingRoutes from './booking.routes.js';
import centreRoutes from './centre.routes.js';
import paymentRoutes from './payment.routes.js';
import testRoutes from './test.routes.js';

const router = Router();

// Base API index & route directory
router.get('/', (req, res) => {
  return sendSuccess(res, {
    service: 'EVE Healthcare Diagnostic Booking API',
    version: '1.0.0',
    status: 'ACTIVE',
    documentation: 'See README.md or /api-docs for interactive Swagger UI',
    swaggerDocs: '/api-docs',
    endpoints: {
      swaggerDocs: 'GET /api-docs',
      health: 'GET /health',
      auth: {
        signup: 'POST /api/auth/signup',
        login: 'POST /api/auth/login',
      },
      centres: {
        list: 'GET /api/centres',
        getById: 'GET /api/centres/:id',
      },
      tests: {
        list: 'GET /api/tests',
        getById: 'GET /api/tests/:id',
      },
      bookings: {
        create: 'POST /api/bookings',
        list: 'GET /api/bookings',
        getById: 'GET /api/bookings/:id',
        cancel: 'PATCH /api/bookings/:id/cancel',
      },
      payments: {
        process: 'POST /api/payments',
        webhook: 'POST /api/payments/webhook',
      },
    },
  });
});

router.use('/auth', authRoutes);
router.use('/centres', centreRoutes);
router.use('/tests', testRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);

export default router;

