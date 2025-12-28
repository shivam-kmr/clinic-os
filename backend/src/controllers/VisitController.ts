import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { VisitService } from '../services/VisitService';
import { QueueService } from '../services/QueueService';
import Doctor from '../models/Doctor';
import Visit from '../models/Visit';

export class VisitController {
  private static async assertReceptionistScope(
    req: AuthRequest,
    opts: { departmentId?: string; doctorId?: string; visitId?: string }
  ): Promise<void> {
    // Only applies to receptionist role
    if (!req.user || req.user.role !== 'RECEPTIONIST') return;

    const membership = (req as any).membership as any | undefined;
    const scopedDepartmentId = membership?.departmentId as string | null | undefined;
    if (!scopedDepartmentId) return; // hospital-wide receptionist

    // For operations on an existing visit, ensure the visit belongs to the scoped department.
    if (opts.visitId) {
      const visit = await Visit.findByPk(opts.visitId);
      if (!visit || visit.hospitalId !== req.user.hospitalId) {
        throw new Error('Visit not found');
      }
      if (visit.departmentId !== scopedDepartmentId) {
        throw new Error('FORBIDDEN_DEPARTMENT_SCOPE');
      }
    }

    // For new visit creation, enforce departmentId/doctorId belong to the scoped department.
    if (opts.departmentId && opts.departmentId !== scopedDepartmentId) {
      throw new Error('FORBIDDEN_DEPARTMENT_SCOPE');
    }

    if (opts.doctorId) {
      const doctor = await Doctor.findByPk(opts.doctorId);
      if (!doctor || doctor.hospitalId !== req.user.hospitalId) {
        throw new Error('Doctor not found');
      }
      if (doctor.departmentId !== scopedDepartmentId) {
        throw new Error('FORBIDDEN_DEPARTMENT_SCOPE');
      }
    }
  }

  /**
   * Create walk-in visit
   * POST /api/v1/visits
   */
  static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { patientId, departmentId, doctorId, priority } = req.body;

      if (!req.user?.hospitalId) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'Hospital context required',
          },
        });
        return;
      }

      // Receptionist scope enforcement: department-specific receptionists can only operate within their department.
      await this.assertReceptionistScope(req, { departmentId, doctorId });

      const visit = await VisitService.createWalkInVisit({
        hospitalId: req.user.hospitalId,
        patientId,
        departmentId,
        doctorId,
        priority,
      });

      res.status(201).json({
        data: visit,
      });
    } catch (error) {
      if ((error as any)?.message === 'FORBIDDEN_DEPARTMENT_SCOPE') {
        res.status(403).json({
          error: { code: 'FORBIDDEN', message: 'Receptionist is not allowed for this department' },
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Get visit by ID
   * GET /api/v1/visits/:id
   */
  static async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!req.user?.hospitalId) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'Hospital context required',
          },
        });
        return;
      }

      const visit = await VisitService.getVisitById(req.user.hospitalId, id);

      if (!visit) {
        res.status(404).json({
          error: {
            code: 'VISIT_NOT_FOUND',
            message: 'Visit not found',
          },
        });
        return;
      }

      res.json({
        data: visit,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update visit status
   * PATCH /api/v1/visits/:id/status
   */
  static async updateStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      if (!req.user?.hospitalId) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'Hospital context required',
          },
        });
        return;
      }

      const visit = await VisitService.updateVisitStatus(
        req.user.hospitalId,
        id,
        status,
        notes
      );

      res.json({
        data: visit,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reassign visit
   * POST /api/v1/visits/:id/reassign
   */
  static async reassign(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { doctorId } = req.body;

      if (!req.user?.hospitalId) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'Hospital context required',
          },
        });
        return;
      }

      if (!doctorId) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'doctorId is required',
          },
        });
        return;
      }

      // Receptionist scope enforcement (visit must be in scope + target doctor must be in scope)
      await this.assertReceptionistScope(req, { visitId: id, doctorId });

      const visit = await QueueService.reassignVisit(
        req.user.hospitalId,
        id,
        doctorId
      );

      res.json({
        data: visit,
      });
    } catch (error) {
      if ((error as any)?.message === 'FORBIDDEN_DEPARTMENT_SCOPE') {
        res.status(403).json({
          error: { code: 'FORBIDDEN', message: 'Receptionist is not allowed for this department' },
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Delay patient (move to end of queue)
   * POST /api/v1/visits/:id/delay
   */
  static async delay(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { doctorId } = req.body;

      if (!req.user?.hospitalId) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'Hospital context required',
          },
        });
        return;
      }

      if (!doctorId) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'doctorId is required',
          },
        });
        return;
      }

      await QueueService.delayPatient(req.user.hospitalId, doctorId, id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

