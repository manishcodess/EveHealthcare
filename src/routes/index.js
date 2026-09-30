import { Router } from 'express';
import authRoutes from './auth.routes.js';
import bookingRoutes from './booking.routes.js';
import centreRoutes from './centre.routes.js';
import paymentRoutes from './payment.routes.js';
import testRoutes from './test.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/centres', centreRoutes);
router.use('/tests', testRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);

export default router;
