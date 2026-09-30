import { CentreService } from '../services/centre.service.js';
import { sendSuccess } from '../utils/response.js';

export class CentreController {
  /**
   * Get all diagnostic centres with optional filtering
   * GET /api/centres
   */
  static async getAllCentres(req, res, next) {
    try {
      const { search, location, testId } = req.query;
      const centres = await CentreService.getAllCentres({ search, location, testId });
      return sendSuccess(res, centres);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single diagnostic centre by ID
   * GET /api/centres/:id
   */
  static async getCentreById(req, res, next) {
    try {
      const { id } = req.params;
      const centre = await CentreService.getCentreById(id);
      return sendSuccess(res, centre);
    } catch (error) {
      next(error);
    }
  }
}
