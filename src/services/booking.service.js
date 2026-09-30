import { prisma } from '../config/prisma.js';
import { BookingStatus } from '../utils/constants.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors.js';

export class BookingService {
  /**
   * Creates a new diagnostic test booking
   * Server determines the price strictly from the database offering.
   *
   * @param {Object} data
   * @param {string} data.userId
   * @param {string} data.centreId
   * @param {string} data.testId
   * @param {string|Date} data.appointmentDate
   */
  static async createBooking({ userId, centreId, testId, appointmentDate }) {
    // 1. Verify that the centre exists
    const centre = await prisma.diagnosticCentre.findUnique({
      where: { id: centreId },
    });

    if (!centre) {
      throw new NotFoundError(`Diagnostic centre with ID '${centreId}' was not found`);
    }

    // 2. Verify that the test exists
    const test = await prisma.diagnosticTest.findUnique({
      where: { id: testId },
    });

    if (!test) {
      throw new NotFoundError(`Diagnostic test with ID '${testId}' was not found`);
    }

    // 3. Retrieve the centre-test offering to determine the true server-side price
    const offering = await prisma.centreTestOffering.findUnique({
      where: {
        centreId_testId: {
          centreId,
          testId,
        },
      },
    });

    if (!offering) {
      throw new BadRequestError(
        `Diagnostic test '${test.name}' is not currently offered at centre '${centre.name}'`
      );
    }

    // 4. Validate appointment date is in future
    const appointmentDateTime = new Date(appointmentDate);
    if (isNaN(appointmentDateTime.getTime()) || appointmentDateTime <= new Date()) {
      throw new BadRequestError('Appointment date must be a valid timestamp in the future');
    }

    // 5. Create the booking with status PENDING and snapshot of the current price
    const booking = await prisma.booking.create({
      data: {
        userId,
        centreId,
        testId,
        offeringId: offering.id,
        appointmentDate: appointmentDateTime,
        amount: offering.price,
        status: BookingStatus.PENDING,
      },
      include: {
        centre: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        test: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      id: booking.id,
      appointmentDate: booking.appointmentDate,
      amount: Number(booking.amount),
      status: booking.status,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      user: booking.user,
      centre: booking.centre,
      test: booking.test,
    };
  }

  /**
   * Retrieves all bookings for the authenticated user
   * @param {string} userId
   * @param {Object} [filters]
   * @param {string} [filters.status]
   */
  static async getUserBookings(userId, filters = {}) {
    const { status } = filters;

    const where = {
      userId,
    };

    if (status) {
      where.status = status;
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        centre: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        test: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    return bookings.map((booking) => ({
      id: booking.id,
      appointmentDate: booking.appointmentDate,
      amount: Number(booking.amount),
      status: booking.status,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      centre: booking.centre,
      test: booking.test,
    }));
  }

  /**
   * Retrieves a specific booking by ID, enforcing user ownership authorization
   * @param {string} bookingId
   * @param {string} userId
   */
  static async getBookingById(bookingId, userId) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        centre: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        test: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundError(`Booking with ID '${bookingId}' was not found`);
    }

    // Ownership check: user can only access their own bookings
    if (booking.userId !== userId) {
      throw new ForbiddenError('You do not have permission to view this booking');
    }

    return {
      id: booking.id,
      appointmentDate: booking.appointmentDate,
      amount: Number(booking.amount),
      status: booking.status,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      user: booking.user,
      centre: booking.centre,
      test: booking.test,
    };
  }
}
