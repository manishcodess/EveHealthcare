import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware.js';
import { createBookingSchema, getBookingsQuerySchema } from '../validators/booking.validator.js';
import { idParamSchema } from '../validators/common.validator.js';

const router = Router();

// Apply requireAuth to all booking routes
router.use(requireAuth);

// POST /api/bookings - Create new diagnostic test booking
router.post('/', validateBody(createBookingSchema), BookingController.createBooking);

// GET /api/bookings - Retrieve all bookings for current authenticated user
router.get('/', validateQuery(getBookingsQuerySchema), BookingController.getMyBookings);

// GET /api/bookings/:id - Retrieve specific booking by ID (ownership enforced)
router.get('/:id', validateParams(idParamSchema), BookingController.getBookingById);

export default router;
