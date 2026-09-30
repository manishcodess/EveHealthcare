import { TestService } from '../services/test.service.js';
import { sendSuccess } from '../utils/response.js';

export class TestController {
  /**
   * Get all diagnostic tests with optional filtering
   * GET /api/tests
   */
  static async getAllTests(req, res, next) {
    try {
      const { search, centreId } = req.query;
      const tests = await TestService.getAllTests({ search, centreId });
      return sendSuccess(res, tests);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single diagnostic test by ID
   * GET /api/tests/:id
   */
  static async getTestById(req, res, next) {
    try {
      const { id } = req.params;
      const test = await TestService.getTestById(id);
      return sendSuccess(res, test);
    } catch (error) {
      next(error);
    }
  }
}
