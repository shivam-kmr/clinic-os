import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ReceptionIntakeService } from '../services/ReceptionIntakeService';
import Doctor from '../models/Doctor';
import Visit from '../models/Visit';

export class ReceptionController {
  private static async assertReceptionistScope(
    req: AuthRequest,
    opts: { departmentId: string; doctorId?: string | null; visitId?: string | null }
  ): Promise<void> {
    // Only applies to receptionist role
    if (!req.user || req.user.role !== 'RECEPTIONIST') return;
    const membership = (req as any).membership as any | undefined;
    const scopedDepartmentId = membership?.departmentId as string | null | undefined;
    if (!scopedDepartmentId) return; // hospital-wide receptionist

    if (opts.departmentId !== scopedDepartmentId) {
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

    if (opts.visitId) {
      const visit = await Visit.findByPk(opts.visitId);
      if (!visit || visit.hospitalId !== req.user.hospitalId) {
        throw new Error('Visit not found');
      }
      if (visit.departmentId !== scopedDepartmentId) {
        throw new Error('FORBIDDEN_DEPARTMENT_SCOPE');
      }
    }
  }

  /**
   * Intake a walk-in patient at reception:
   * - upsert patient by phone
   * - create WALK_IN appointment
   * - check-in immediately (creates visit + token)
   *
   * POST /api/v1/reception/intake
   */
  static async intake(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.hospitalId) {
        res.status(400).json({
          error: { code: 'BAD_REQUEST', message: 'Hospital context required' },
        });
        return;
      }

      const {
        phone,
        firstName,
        lastName,
        age,
        gender,
        issueDescription,
        departmentId,
        scheduledAt,
      } = req.body || {};

      if (!phone || !firstName || !lastName || !departmentId) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'phone, firstName, lastName and departmentId are required',
          },
        });
        return;
      }

      await ReceptionController.assertReceptionistScope(req, { departmentId });

      const scheduledDate = scheduledAt ? new Date(scheduledAt) : null;

      const result = await ReceptionIntakeService.intakeWalkIn({
        hospitalId: req.user.hospitalId,
        patient: {
          phone: String(phone),
          firstName: String(firstName),
          lastName: String(lastName),
          age: typeof age === 'number' ? age : age ? Number(age) : undefined,
          gender: (gender || 'UNKNOWN') as any,
        },
        departmentId: String(departmentId),
        issueDescription: issueDescription ? String(issueDescription) : undefined,
        scheduledAt: scheduledDate,
      });

      res.status(201).json({ data: result });
    } catch (error: any) {
      if (error?.message === 'FORBIDDEN_DEPARTMENT_SCOPE') {
        res.status(403).json({
          error: { code: 'FORBIDDEN', message: 'Receptionist is not allowed for this department' },
        });
        return;
      }
      next(error);
    }
  }
}


