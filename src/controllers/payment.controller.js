import { PaymentService } from '../services/payment.service.js';
import { sendCreated, sendSuccess } from '../utils/response.js';

export class PaymentController {
  /**
   * Process a direct mock payment for a booking
   * POST /api/payments or POST /payments
   */
  static async processPayment(req, res, next) {
    try {
      const userId = req.user.id;
      const { bookingId, paymentMethod, simulateFailure } = req.body;

      const result = await PaymentService.processPayment({
        userId,
        bookingId,
        paymentMethod,
        simulateFailure,
      });

      return sendCreated(res, result, 'Payment processed successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Process an incoming payment webhook event
   * POST /api/payments/webhook or POST /payments/webhook
   */
  static async processWebhook(req, res, next) {
    try {
      const { eventId, bookingId, status, amount, paymentMethod } = req.body;

      const result = await PaymentService.processWebhook({
        eventId,
        bookingId,
        status,
        amount,
        paymentMethod,
        rawPayload: req.body,
      });

      return sendSuccess(res, result, 200, result.message);
    } catch (error) {
      next(error);
    }
  }
}
