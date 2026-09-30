import { prisma } from '../config/prisma.js';
import { NotFoundError } from '../utils/errors.js';

export class TestService {
  /**
   * Retrieves all diagnostic tests with optional search filter and centre offerings
   * @param {Object} [filters]
   * @param {string} [filters.search]
   * @param {string} [filters.centreId]
   */
  static async getAllTests(filters = {}) {
    const { search, centreId } = filters;

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (centreId) {
      where.offerings = {
        some: {
          centreId,
        },
      };
    }

    const tests = await prisma.diagnosticTest.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        offerings: {
          select: {
            id: true,
            price: true,
            centre: {
              select: {
                id: true,
                name: true,
                location: true,
              },
            },
          },
        },
      },
    });

    return tests.map((test) => ({
      id: test.id,
      name: test.name,
      description: test.description,
      createdAt: test.createdAt,
      updatedAt: test.updatedAt,
      availableCentresCount: test.offerings.length,
      availableAtCentres: test.offerings.map((offering) => ({
        offeringId: offering.id,
        centreId: offering.centre.id,
        centreName: offering.centre.name,
        centreLocation: offering.centre.location,
        price: Number(offering.price),
      })),
    }));
  }

  /**
   * Retrieves a single diagnostic test by ID with all centres offering it and prices
   * @param {string} testId
   */
  static async getTestById(testId) {
    const test = await prisma.diagnosticTest.findUnique({
      where: { id: testId },
      include: {
        offerings: {
          select: {
            id: true,
            price: true,
            centre: {
              select: {
                id: true,
                name: true,
                location: true,
              },
            },
          },
        },
      },
    });

    if (!test) {
      throw new NotFoundError(`Diagnostic test with ID '${testId}' was not found`);
    }

    return {
      id: test.id,
      name: test.name,
      description: test.description,
      createdAt: test.createdAt,
      updatedAt: test.updatedAt,
      availableCentresCount: test.offerings.length,
      availableAtCentres: test.offerings.map((offering) => ({
        offeringId: offering.id,
        centreId: offering.centre.id,
        centreName: offering.centre.name,
        centreLocation: offering.centre.location,
        price: Number(offering.price),
      })),
    };
  }
}
