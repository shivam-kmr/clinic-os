import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import '../models'; // ensure associations are initialized for includes
import { HospitalSetupService } from '../services/HospitalSetupService';
import HospitalUser from '../models/HospitalUser';
import Hospital from '../models/Hospital';
import Department from '../models/Department';
import DepartmentConfig from '../models/DepartmentConfig';

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

      // Multi-clinic: allow users to create multiple hospitals (they become owner of the new one)

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
   * Get department configuration
   * GET /api/v1/setup/departments/:departmentId/config
   */
  static async getDepartmentConfig(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user?.hospitalId) {
        res.status(400).json({
          error: { code: 'BAD_REQUEST', message: 'Hospital context required' },
        });
        return;
      }

      const { departmentId } = req.params as any;
      const department = await Department.findOne({
        where: { id: departmentId, hospitalId: req.user.hospitalId },
      });
      if (!department) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Department not found' },
        });
        return;
      }

      const config = await DepartmentConfig.findOne({
        where: { hospitalId: req.user.hospitalId, departmentId },
      });

      res.json({ data: config || null });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update department configuration
   * PUT /api/v1/setup/departments/:departmentId/config
   */
  static async updateDepartmentConfig(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user?.hospitalId) {
        res.status(400).json({
          error: { code: 'BAD_REQUEST', message: 'Hospital context required' },
        });
        return;
      }

      const { departmentId } = req.params as any;
      const department = await Department.findOne({
        where: { id: departmentId, hospitalId: req.user.hospitalId },
      });
      if (!department) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Department not found' },
        });
        return;
      }

      const [config] = await DepartmentConfig.findOrCreate({
        where: { hospitalId: req.user.hospitalId, departmentId },
        defaults: { hospitalId: req.user.hospitalId, departmentId, bookingMode: null },
      });

      // Allow explicit nulls so callers can "clear override" and fall back to clinic defaults.
      const body = req.body || {};
      const patch: any = {};
      const setIfPresent = (key: string) => {
        if (Object.prototype.hasOwnProperty.call(body, key)) {
          patch[key] = body[key];
        }
      };

      setIfPresent('bookingMode');
      setIfPresent('tokenResetFrequency');
      setIfPresent('maxQueueLength');
      setIfPresent('tokenPrefix');
      setIfPresent('defaultConsultationDuration');
      setIfPresent('bufferTimeBetweenAppointments');
      setIfPresent('arrivalWindowBeforeAppointment');

      await config.update(patch);

      res.json({ data: config });
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

      // Multi-clinic: allow selecting hospital via X-Hospital-Id header.
      // If not provided, and the user has exactly one membership, default to that.
      const headerHospitalId = req.headers['x-hospital-id'] as string | undefined;

      const memberships = await HospitalUser.findAll({
        where: { userId: req.user.id },
        include: [{ model: Hospital, as: 'hospital', attributes: ['id', 'name'], required: true }],
        order: [['createdAt', 'ASC']],
      });

      const selectedHospitalId =
        headerHospitalId ||
        (memberships.length === 1 ? memberships[0].hospitalId : null);

      if (!selectedHospitalId) {
        res.json({
          data: {
            hospital: null,
            config: null,
            departments: [],
            doctors: [],
            receptionists: [],
            memberships: memberships.map((m: any) => ({
              hospitalId: m.hospitalId,
              hospitalName: m.hospital?.name || 'Hospital',
              role: m.role,
              doctorId: m.doctorId || null,
              departmentId: m.departmentId || null,
            })),
          },
        });
        return;
      }

      // Verify membership
      const membership = memberships.find((m) => m.hospitalId === selectedHospitalId);
      if (!membership && req.user.role !== 'SUPERADMIN') {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied - you are not a member of this hospital',
          },
        });
        return;
      }

      // Setup payload is readable by all members (view-only for non owners/managers).
      // Mutations are still protected by requireRole at the route level.
      const canManageSetup =
        req.user.role === 'SUPERADMIN' ||
        (membership?.role === 'HOSPITAL_OWNER' || membership?.role === 'HOSPITAL_MANAGER');

      const setup = await HospitalSetupService.getHospitalSetup(selectedHospitalId);

      res.json({
        data: {
          ...setup,
          canManageSetup,
          memberships: memberships.map((m: any) => ({
            hospitalId: m.hospitalId,
            hospitalName: m.hospital?.name || 'Hospital',
            role: m.role,
            doctorId: m.doctorId || null,
            departmentId: m.departmentId || null,
          })),
        },
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

  /**
   * Suggest/validate subdomain for a hospital name
   * GET /api/v1/setup/subdomain/suggest?name=Regency%20Hospital
   *
   * Returns:
   * - base: slug derived from name (lowercase, no spaces)
   * - available: whether base is available
   * - suggestedSubdomain: base if available, else base-xxxx
   */
  static async suggestSubdomain(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
        return;
      }

      const name = (req.query.name as string | undefined) || '';
      if (!name.trim()) {
        res.status(400).json({
          error: { code: 'BAD_REQUEST', message: 'name query param is required' },
        });
        return;
      }

      const info = await HospitalSetupService.suggestSubdomainFromName(name);
      res.json({ data: info });
    } catch (error) {
      next(error);
    }
  }
}

