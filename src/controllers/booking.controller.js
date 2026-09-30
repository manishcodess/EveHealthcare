import { BookingService } from '../services/booking.service.js';
import { sendCreated, sendSuccess } from '../utils/response.js';

export class BookingController {
  /**
   * Create a new booking
   * POST /api/bookings
   */
  static async createBooking(req, res, next) {
    try {
      const userId = req.user.id;
      const { centreId, testId, appointmentDate } = req.body;

      const booking = await BookingService.createBooking({
        userId,
        centreId,
        testId,
        appointmentDate,
      });

      return sendCreated(res, booking, 'Booking created successfully with status PENDING');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all bookings for the authenticated user
   * GET /api/bookings
   */
  static async getMyBookings(req, res, next) {
    try {
      const userId = req.user.id;
      const { status } = req.query;

      const bookings = await BookingService.getUserBookings(userId, { status });
      return sendSuccess(res, bookings);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single booking by ID for the authenticated user
   * GET /api/bookings/:id
   */
  static async getBookingById(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const booking = await BookingService.getBookingById(id, userId);
      return sendSuccess(res, booking);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel an existing booking
   * PATCH /api/bookings/:id/cancel
   */
  static async cancelBooking(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const result = await BookingService.cancelBooking(id, userId);
      return sendSuccess(res, result, 200, 'Booking cancelled successfully');
    } catch (error) {
      next(error);
    }
  }
}
