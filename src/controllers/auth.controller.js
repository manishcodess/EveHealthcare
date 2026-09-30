import { AuthService } from '../services/auth.service.js';
import { sendCreated, sendSuccess } from '../utils/response.js';

export class AuthController {
  /**
   * Register a new user
   * POST /api/auth/signup
   */
  static async signup(req, res, next) {
    try {
      const { name, email, password } = req.body;
      const result = await AuthService.signup({ name, email, password });
      return sendCreated(res, result, 'User registered successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login({ email, password });
      return sendSuccess(res, result, 200, 'Login successful');
    } catch (error) {
      next(error);
    }
  }
}
