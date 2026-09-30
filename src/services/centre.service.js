import { prisma } from '../config/prisma.js';
import { NotFoundError } from '../utils/errors.js';

export class CentreService {
  /**
   * Retrieves all diagnostic centres with optional filtering and included test offerings
   * @param {Object} [filters]
   * @param {string} [filters.search]
   * @param {string} [filters.location]
   * @param {string} [filters.testId]
   */
  static async getAllCentres(filters = {}) {
    const { search, location, testId } = filters;

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (testId) {
      where.offerings = {
        some: {
          testId,
        },
      };
    }

    const centres = await prisma.diagnosticCentre.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        offerings: {
          select: {
            id: true,
            price: true,
            test: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

    return centres.map((centre) => ({
      id: centre.id,
      name: centre.name,
      location: centre.location,
      createdAt: centre.createdAt,
      updatedAt: centre.updatedAt,
      offeringsCount: centre.offerings.length,
      availableTests: centre.offerings.map((offering) => ({
        offeringId: offering.id,
        testId: offering.test.id,
        testName: offering.test.name,
        testDescription: offering.test.description,
        price: Number(offering.price),
      })),
    }));
  }

  /**
   * Retrieves a single diagnostic centre by ID with full offerings
   * @param {string} centreId
   */
  static async getCentreById(centreId) {
    const centre = await prisma.diagnosticCentre.findUnique({
      where: { id: centreId },
      include: {
        offerings: {
          select: {
            id: true,
            price: true,
            test: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!centre) {
      throw new NotFoundError(`Diagnostic centre with ID '${centreId}' was not found`);
    }

    return {
      id: centre.id,
      name: centre.name,
      location: centre.location,
      createdAt: centre.createdAt,
      updatedAt: centre.updatedAt,
      offeringsCount: centre.offerings.length,
      availableTests: centre.offerings.map((offering) => ({
        offeringId: offering.id,
        testId: offering.test.id,
        testName: offering.test.name,
        testDescription: offering.test.description,
        price: Number(offering.price),
      })),
    };
  }
}
