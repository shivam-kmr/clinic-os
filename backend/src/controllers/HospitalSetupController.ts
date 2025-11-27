import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { HospitalSetupService } from '../services/HospitalSetupService';

export class HospitalSetupController {
  /**
   * Create hospital
   * POST /api/v1/setup/hospital
   */
  static async createHospital(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
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

      // Check if user already has a hospital
      if (req.user.hospitalId) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'User already has a hospital assigned',
          },
        });
        return;
      }

      // Check if user is HOSPITAL_OWNER or allow if they don't have hospitalId
      if (req.user.role !== 'HOSPITAL_OWNER' && req.user.role !== 'SUPERADMIN') {
        // Allow RECEPTIONIST or DOCTOR to create hospital if they don't have one
        // This enables the setup flow for new users
      }

      const hospital = await HospitalSetupService.createHospital(
        req.user.id,
        req.body
      );

      res.status(201).json({
        data: hospital,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update hospital config
   * PUT /api/v1/setup/hospital/config
   */
  static async updateConfig(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user?.hospitalId) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'Hospital context required',
          },
        });
        return;
      }

      const config = await HospitalSetupService.updateHospitalConfig(
        req.user.hospitalId,
        req.body
      );

      res.json({
        data: config,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create department
   * POST /api/v1/setup/departments
   */
  static async createDepartment(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user?.hospitalId) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'Hospital context required',
          },
        });
        return;
      }

      const department = await HospitalSetupService.createDepartment(
        req.user.hospitalId,
        req.body
      );

      res.status(201).json({
        data: department,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create doctor
   * POST /api/v1/setup/doctors
   */
  static async createDoctor(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user?.hospitalId) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'Hospital context required',
          },
        });
        return;
      }

      const { doctor, user } = await HospitalSetupService.createDoctor(
        req.user.hospitalId,
        req.body
      );

      res.status(201).json({
        data: {
          doctor,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create receptionist
   * POST /api/v1/setup/receptionists
   */
  static async createReceptionist(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user?.hospitalId) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'Hospital context required',
          },
        });
        return;
      }

      const user = await HospitalSetupService.createReceptionist(
        req.user.hospitalId,
        req.body
      );

      res.status(201).json({
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get hospital setup data
   * GET /api/v1/setup
   */
  static async getSetup(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
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

      // If user doesn't have hospitalId, return empty setup
      if (!req.user.hospitalId) {
        res.json({
          data: {
            hospital: null,
            config: null,
            departments: [],
            doctors: [],
          },
        });
        return;
      }

      const setup = await HospitalSetupService.getHospitalSetup(
        req.user.hospitalId
      );

      res.json({
        data: setup,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update hospital (for custom domain)
   * PATCH /api/v1/setup/hospital
   */
  static async updateHospital(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user?.hospitalId) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'Hospital context required',
          },
        });
        return;
      }

      const hospital = await HospitalSetupService.updateHospital(
        req.user.hospitalId,
        req.body
      );

      res.json({
        data: hospital,
      });
    } catch (error) {
      next(error);
    }
  }
}

