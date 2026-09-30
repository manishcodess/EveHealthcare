import { z } from 'zod';
import { PaymentStatus } from '../utils/constants.js';

export const createPaymentSchema = z.object({
  bookingId: z
    .string({ required_error: 'Booking ID is required' })
    .trim()
    .min(1, 'Booking ID cannot be empty'),
  paymentMethod: z
    .string()
    .trim()
    .optional()
    .default('MOCK_GATEWAY'),
  simulateFailure: z
    .boolean()
    .optional()
    .default(false),
});

export const webhookSchema = z.object({
  eventId: z
    .string({ required_error: 'Event ID (eventId) is required' })
    .trim()
    .min(1, 'Event ID cannot be empty'),
  bookingId: z
    .string({ required_error: 'Booking ID is required' })
    .trim()
    .min(1, 'Booking ID cannot be empty'),
  status: z.enum(['SUCCESS', 'FAILED'], {
    required_error: 'Payment status is required and must be SUCCESS or FAILED',
    invalid_type_error: 'Status must be either SUCCESS or FAILED',
  }),
  amount: z.coerce.number().positive().optional(),
  paymentMethod: z.string().trim().optional().default('WEBHOOK_GATEWAY'),
  eventType: z.string().trim().optional().default('payment.status_updated'),
});
