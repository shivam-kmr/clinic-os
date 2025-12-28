import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ReceptionIntakeService } from '../services/ReceptionIntakeService';
import Doctor from '../models/Doctor';
import Visit from '../models/Visit';
import VisitHistory from '../models/VisitHistory';
import Patient from '../models/Patient';
import { Op } from 'sequelize';
import sequelize from '../config/database';

export class ReceptionController {
  private static ageFromDob(dob?: Date | null): number | null {
    if (!dob) return null;
    const d = new Date(dob);
    if (isNaN(d.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
    if (!Number.isFinite(age) || age < 0 || age > 130) return null;
    return age;
  }

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

  /**
   * Lookup patient profiles by phone number (scoped to active hospital)
   * GET /api/v1/reception/patients/by-phone?phone=9876543210
   */
  static async patientsByPhone(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.hospitalId) {
        res.status(400).json({
          error: { code: 'BAD_REQUEST', message: 'Hospital context required' },
        });
        return;
      }

      const phoneRaw = String(req.query.phone || '').trim();
      const phone = phoneRaw.replace(/\D/g, '');

      if (!phone || phone.length < 7) {
        res.status(400).json({
          error: { code: 'BAD_REQUEST', message: 'phone query param is required' },
        });
        return;
      }

      const patients = await Patient.findAll({
        where: {
          hospitalId: req.user.hospitalId,
          phone,
        },
        attributes: ['id', 'firstName', 'lastName', 'gender', 'dateOfBirth', 'createdAt', 'updatedAt'],
        order: [
          ['updatedAt', 'DESC'],
          ['createdAt', 'DESC'],
        ],
      });

      res.json({
        data: patients.map((p: any) => ({
          id: p.id,
          firstName: p.firstName,
          lastName: p.lastName,
          gender: p.gender,
          age: ReceptionController.ageFromDob(p.dateOfBirth),
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get today's quick metrics (scoped to active hospital; receptionist may be department-scoped)
   * GET /api/v1/reception/metrics/today
   */
  static async metricsToday(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.hospitalId) {
        res.status(400).json({
          error: { code: 'BAD_REQUEST', message: 'Hospital context required' },
        });
        return;
      }

      const hospitalId = req.user.hospitalId;
      const membership = (req as any).membership as any | undefined;
      const scopedDepartmentId =
        req.user.role === 'RECEPTIONIST' ? (membership?.departmentId as string | null | undefined) : null;

      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      const visitWhere: any = {
        hospitalId,
        checkedInAt: { [Op.gte]: start, [Op.lt]: end },
        status: { [Op.notIn]: ['CANCELLED', 'NO_SHOW'] },
      };
      if (scopedDepartmentId) visitWhere.departmentId = scopedDepartmentId;

      const doctorsWhere: any = { hospitalId, status: 'ACTIVE' };
      if (scopedDepartmentId) doctorsWhere.departmentId = scopedDepartmentId;

      const waitWhere: any = {
        hospitalId,
        completedAt: { [Op.gte]: start, [Op.lt]: end },
        actualWaitTime: { [Op.ne]: null },
      };
      if (scopedDepartmentId) waitWhere.departmentId = scopedDepartmentId;

      const [todaysVisits, activeDoctors, avgWaitRow] = await Promise.all([
        Visit.count({ where: visitWhere }),
        Doctor.count({ where: doctorsWhere }),
        VisitHistory.findOne({
          where: waitWhere,
          attributes: [[sequelize.fn('AVG', sequelize.col('actualWaitTime')), 'avgWait']],
          raw: true,
        }),
      ]);

      const avgWait = avgWaitRow ? Number((avgWaitRow as any).avgWait) : NaN;
      const averageWaitMinutes = Number.isFinite(avgWait) ? Math.round(avgWait) : 0;

      res.json({
        data: {
          todaysVisits,
          averageWaitMinutes,
          activeDoctors,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get live queue metrics (scoped to active hospital; receptionist may be department-scoped)
   * GET /api/v1/reception/metrics/live
   *
   * Returns:
   * - totalInQueue: count of visits currently in queue statuses
   * - inProgress: count of IN_PROGRESS visits
   * - averageWaitMinutes: approximate estimated wait in minutes based on doctor pace patterns
   */
  static async metricsLive(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.hospitalId) {
        res.status(400).json({
          error: { code: 'BAD_REQUEST', message: 'Hospital context required' },
        });
        return;
      }

      const hospitalId = req.user.hospitalId;
      const membership = (req as any).membership as any | undefined;
      const scopedDepartmentId =
        req.user.role === 'RECEPTIONIST' ? (membership?.departmentId as string | null | undefined) : null;

      const queueStatuses = ['WAITING', 'CHECKED_IN', 'IN_PROGRESS', 'ON_HOLD', 'CARRYOVER'];

      const whereQueue: any = {
        hospitalId,
        status: { [Op.in]: queueStatuses },
      };
      if (scopedDepartmentId) whereQueue.departmentId = scopedDepartmentId;

      const whereDoctors: any = {
        hospitalId,
        status: 'ACTIVE',
      };
      if (scopedDepartmentId) whereDoctors.departmentId = scopedDepartmentId;

      const [totalInQueue, inProgress, activeDoctorIds, paceRows] = await Promise.all([
        Visit.count({ where: whereQueue }),
        Visit.count({ where: { ...whereQueue, status: 'IN_PROGRESS' } }),
        Doctor.findAll({
          where: whereDoctors,
          attributes: ['id'],
          raw: true,
        }).then((rows: any[]) => rows.map((r) => String(r.id))),
        VisitHistory.findAll({
          where: {
            hospitalId,
            ...(scopedDepartmentId ? { departmentId: scopedDepartmentId } : {}),
            actualConsultationDuration: { [Op.ne]: null },
            completedAt: { [Op.gte]: sequelize.literal(`NOW() - INTERVAL '7 days'`) } as any,
          } as any,
          attributes: ['doctorId', [sequelize.fn('AVG', sequelize.col('actualConsultationDuration')), 'avgMinutes']],
          group: ['doctorId'],
          raw: true,
        }),
      ]);

      // Build pace map (doctorId -> minutes), default 15
      const paceByDoctor: Record<string, number> = {};
      for (const r of paceRows as any[]) {
        const avg = Number(r.avgMinutes);
        if (Number.isFinite(avg) && avg > 0) {
          paceByDoctor[String(r.doctorId)] = Math.max(3, Math.min(60, Math.round(avg)));
        }
      }

      // Get queue counts per doctor in one query
      const countsByDoctor = await Visit.findAll({
        where: whereQueue,
        attributes: ['doctorId', [sequelize.fn('COUNT', sequelize.col('id')), 'cnt']],
        group: ['doctorId'],
        raw: true,
      });

      let weightedSum = 0;
      let weightedN = 0;
      for (const row of countsByDoctor as any[]) {
        const doctorId = String(row.doctorId);
        const k = Number(row.cnt) || 0;
        if (!doctorId || k <= 0) continue;

        // Only consider active doctors for pace; fallback to 15 if unknown.
        const pace = paceByDoctor[doctorId] || 15;

        // Approx average wait for a FIFO queue of length k:
        // waits are 0, pace, 2*pace, ... (k-1)*pace => avg = ((k-1)/2)*pace
        const avgWaitForDoctor = ((k - 1) / 2) * pace;
        weightedSum += avgWaitForDoctor * k;
        weightedN += k;
      }

      const averageWaitMinutes = weightedN > 0 ? Math.max(0, Math.round(weightedSum / weightedN)) : 0;

      res.json({
        data: {
          totalInQueue,
          inProgress,
          averageWaitMinutes,
          activeDoctors: activeDoctorIds.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}


