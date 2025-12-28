import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AuthService } from '../services/AuthService';
import { GoogleAuthService } from '../services/GoogleAuthService';

export class AuthController {
  /**
   * Login
   * POST /api/v1/auth/login
   */
  static async login(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'Email and password are required',
          },
        });
        return;
      }

      const result = await AuthService.login({ email, password });

      res.json({
        data: result,
      });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'Invalid email or password') {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: err.message,
          },
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Register
   * POST /api/v1/auth/register
   */
  static async register(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, firstName, lastName, role, hospitalId } = req.body;

      if (!email || !password || !firstName || !lastName || !role) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'Email, password, firstName, lastName, and role are required',
          },
        });
        return;
      }

      const result = await AuthService.register({
        email,
        password,
        firstName,
        lastName,
        role,
        hospitalId,
      });

      res.status(201).json({
        data: result,
      });
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('already exists')) {
        res.status(409).json({
          error: {
            code: 'CONFLICT',
            message: err.message,
          },
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Get current user
   * GET /api/v1/auth/me
   */
  static async getCurrentUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const user = await AuthService.getCurrentUser(req.user.id);

      res.json({
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List clinics (memberships) for the current user
   * GET /api/v1/auth/clinics
   */
  static async getClinics(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const memberships = await AuthService.getMemberships(req.user.id);
      res.json({ data: memberships });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Google OAuth URL
   * GET /api/v1/auth/google/url
   */
  static async getGoogleAuthUrl(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUrl = GoogleAuthService.getAuthUrl();
      res.json({
        data: { authUrl },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Google OAuth callback
   * GET /api/v1/auth/google/callback
   */
  static async googleCallback(req: AuthRequest, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { code } = req.query;

      if (!code || typeof code !== 'string') {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'Authorization code is required',
          },
        });
        return;
      }

      const result = await GoogleAuthService.handleCallback(code);

      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/auth/callback?token=${result.token}&user=${encodeURIComponent(JSON.stringify(result.user))}`);
    } catch (error) {
      const err = error as Error;
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(err.message)}`);
    }
  }

  /**
   * Login with Google ID token or user info (direct from frontend)
   * POST /api/v1/auth/google/login
   */
  static async googleLogin(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { idToken, email, name, googleId } = req.body;

      let result: any;

      if (idToken) {
        // Use ID token flow (more secure)
        result = await GoogleAuthService.loginWithIdToken(idToken);
      } else if (email && name) {
        // Use simplified flow with email/name (from OAuth access token)
        result = await GoogleAuthService.loginOrRegisterWithGoogleInfo(email, name, googleId);
      } else {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'Either idToken or (email and name) is required',
          },
        });
        return;
      }

      res.json({
        data: result,
      });
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('not found')) {
        res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: err.message,
          },
        });
        return;
      }
      next(error);
    }
  }
}

