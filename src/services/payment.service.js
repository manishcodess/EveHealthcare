import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { BookingStatus, PaymentStatus } from '../utils/constants.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../utils/errors.js';

export class PaymentService {
  /**
   * Process a direct mock payment for a booking
   *
   * @param {Object} params
   * @param {string} params.userId - Authenticated user ID
   * @param {string} params.bookingId - Target booking ID
   * @param {string} [params.paymentMethod='MOCK_GATEWAY'] - Payment method used
   * @param {boolean} [params.simulateFailure=false] - Whether to simulate a failed payment
   */
  static async processPayment({ userId, bookingId, paymentMethod = 'MOCK_GATEWAY', simulateFailure = false }) {
    // 1. Fetch booking with details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        centre: {
          select: { id: true, name: true, location: true },
        },
        test: {
          select: { id: true, name: true },
        },
      },
    });

    if (!booking) {
      throw new NotFoundError(`Booking with ID '${bookingId}' was not found`);
    }

    // 2. Ownership verification
    if (booking.userId !== userId) {
      throw new ForbiddenError('You do not have permission to pay for this booking');
    }

    // 3. State verification
    if (booking.status === BookingStatus.CONFIRMED) {
      throw new ConflictError('This booking is already confirmed and paid');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestError('Cannot process payment for a cancelled booking');
    }

    // 4. Determine payment outcome
    const isSuccess = !simulateFailure;
    const paymentStatus = isSuccess ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;
    const targetBookingStatus = isSuccess ? BookingStatus.CONFIRMED : BookingStatus.FAILED;

    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const eventId = `evt_mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // 5. Execute atomic transaction to persist Payment and transition Booking state
    const result = await prisma.$transaction(async (tx) => {
      // Record payment
      const payment = await tx.payment.create({
        data: {
          bookingId: booking.id,
          eventId,
          amount: booking.amount,
          status: paymentStatus,
          paymentMethod,
          transactionId,
        },
      });

      // Update booking status
      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: { status: targetBookingStatus },
        include: {
          centre: { select: { id: true, name: true, location: true } },
          test: { select: { id: true, name: true } },
        },
      });

      return { payment, booking: updatedBooking };
    });

    return {
      payment: {
        id: result.payment.id,
        bookingId: result.payment.bookingId,
        amount: Number(result.payment.amount),
        status: result.payment.status,
        paymentMethod: result.payment.paymentMethod,
        transactionId: result.payment.transactionId,
        createdAt: result.payment.createdAt,
      },
      booking: {
        id: result.booking.id,
        status: result.booking.status,
        amount: Number(result.booking.amount),
        appointmentDate: result.booking.appointmentDate,
        centre: result.booking.centre,
        test: result.booking.test,
      },
    };
  }

  /**
   * Process an incoming payment webhook event with strict idempotency and state protection
   *
   * @param {Object} params
   * @param {string} params.eventId - Unique event identifier from payment provider
   * @param {string} params.bookingId - Associated booking ID
   * @param {'SUCCESS'|'FAILED'} params.status - Incoming payment status
   * @param {number} [params.amount] - Transaction amount (optional)
   * @param {string} [params.paymentMethod] - Payment provider/method
   * @param {any} [params.rawPayload] - Full raw payload for auditing
   */
  static async processWebhook({ eventId, bookingId, status, amount, paymentMethod = 'WEBHOOK_GATEWAY', rawPayload }) {
    // 1. Application-level Idempotency Check
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { eventId },
    });

    if (existingEvent) {
      // Return cached/idempotent result without modifying database state
      const associatedBooking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { id: true, status: true, amount: true },
      });

      const associatedPayment = await prisma.payment.findUnique({
        where: { eventId },
      });

      return {
        idempotent: true,
        eventId,
        bookingId,
        status: existingEvent.status,
        bookingStatus: associatedBooking?.status || 'UNKNOWN',
        payment: associatedPayment
          ? {
              id: associatedPayment.id,
              amount: Number(associatedPayment.amount),
              status: associatedPayment.status,
              transactionId: associatedPayment.transactionId,
            }
          : null,
        message: 'Webhook event was already processed previously (idempotent replay)',
      };
    }

    // 2. Fetch booking to validate existence and state
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundError(`Booking with ID '${bookingId}' was not found`);
    }

    // 3. State transition rules
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestError('Cannot process payment webhook for a cancelled booking');
    }

    if (booking.status === BookingStatus.CONFIRMED && status === PaymentStatus.FAILED) {
      throw new ConflictError('Cannot mark an already confirmed and paid booking as failed');
    }

    const targetBookingStatus = status === PaymentStatus.SUCCESS ? BookingStatus.CONFIRMED : BookingStatus.FAILED;
    const transactionId = `txn_wh_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // 4. Atomic transaction with concurrent duplicate protection
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Record webhook event in audit log (has UNIQUE constraint on eventId)
        await tx.webhookEvent.create({
          data: {
            eventId,
            bookingId: booking.id,
            status,
            payload: rawPayload ? (typeof rawPayload === 'string' ? rawPayload : JSON.stringify(rawPayload)) : null,
          },
        });

        // Record payment
        const payment = await tx.payment.create({
          data: {
            bookingId: booking.id,
            eventId,
            amount: booking.amount,
            status: status === PaymentStatus.SUCCESS ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
            paymentMethod,
            transactionId,
          },
        });

        // Update booking status
        const updatedBooking = await tx.booking.update({
          where: { id: booking.id },
          data: { status: targetBookingStatus },
        });

        return { payment, booking: updatedBooking };
      });

      return {
        idempotent: false,
        eventId,
        bookingId: result.booking.id,
        status: result.payment.status,
        bookingStatus: result.booking.status,
        payment: {
          id: result.payment.id,
          amount: Number(result.payment.amount),
          status: result.payment.status,
          transactionId: result.payment.transactionId,
          paymentMethod: result.payment.paymentMethod,
          createdAt: result.payment.createdAt,
        },
        message: `Webhook processed successfully: Booking status updated to ${result.booking.status}`,
      };
    } catch (error) {
      // Concurrency protection: If a concurrent request with the same eventId succeeded milliseconds earlier
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const targetBooking = await prisma.booking.findUnique({ where: { id: bookingId } });
        const targetPayment = await prisma.payment.findUnique({ where: { eventId } });

        return {
          idempotent: true,
          eventId,
          bookingId,
          status,
          bookingStatus: targetBooking?.status || 'UNKNOWN',
          payment: targetPayment
            ? {
                id: targetPayment.id,
                amount: Number(targetPayment.amount),
                status: targetPayment.status,
                transactionId: targetPayment.transactionId,
              }
            : null,
          message: 'Concurrent webhook event was already processed (race condition handled idempotently)',
        };
      }

      throw error;
    }
  }
}
