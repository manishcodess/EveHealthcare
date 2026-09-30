import { z } from 'zod';
import { BookingStatus } from '../utils/constants.js';

export const createBookingSchema = z.object({
  centreId: z
    .string({ required_error: 'Diagnostic centre ID is required' })
    .trim()
    .min(1, 'Diagnostic centre ID cannot be empty'),
  testId: z
    .string({ required_error: 'Diagnostic test ID is required' })
    .trim()
    .min(1, 'Diagnostic test ID cannot be empty'),
  appointmentDate: z
    .string({ required_error: 'Appointment date is required' })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Appointment date must be a valid ISO datetime string',
    })
    .refine((val) => new Date(val) > new Date(), {
      message: 'Appointment date must be in the future',
    }),
});

export const getBookingsQuerySchema = z.object({
  status: z.nativeEnum(BookingStatus).optional(),
});
