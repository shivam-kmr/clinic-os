import { Request, Response } from 'express';
import { PatientAuthService } from '../services/PatientAuthService';
import { errorHandler } from '../middleware/errorHandler';

export class PatientAuthController {
  /**
   * POST /api/v1/patient/auth/login
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const hospitalId = req.hospitalContext?.id;

      if (!hospitalId) {
        res.status(400).json({
          error: {
            code: 'HOSPITAL_CONTEXT_REQUIRED',
            message: 'Hospital context is required',
          },
        });
        return;
      }

      if (!email || !password) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email and password are required',
          },
        });
        return;
      }

      const result = await PatientAuthService.login({
        email,
        password,
        hospitalId,
      });

      res.json(result);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * POST /api/v1/patient/auth/register
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName, phone } = req.body;
      const hospitalId = req.hospitalContext?.id;

      if (!hospitalId) {
        res.status(400).json({
          error: {
            code: 'HOSPITAL_CONTEXT_REQUIRED',
            message: 'Hospital context is required',
          },
        });
        return;
      }

      if (!email || !password || !firstName || !lastName) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email, password, firstName, and lastName are required',
          },
        });
        return;
      }

      const result = await PatientAuthService.register({
        email,
        password,
        firstName,
        lastName,
        phone,
        hospitalId,
      });

      res.status(201).json(result);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * GET /api/v1/patient/auth/me
   */
  static async getCurrentPatient(req: Request, res: Response): Promise<void> {
    try {
      const patientUserId = (req as any).patientUser?.id;
      const hospitalId = req.hospitalContext?.id;

      if (!patientUserId || !hospitalId) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const patient = await PatientAuthService.getCurrentPatient(patientUserId, hospitalId);
      res.json({ patient });
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }
}



