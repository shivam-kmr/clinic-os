import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import HospitalUser from '../models/HospitalUser';
import User from '../models/User';
import Doctor from '../models/Doctor';
import Department from '../models/Department';

export class TeamController {
  /**
   * List staff members for the active hospital context.
   * GET /api/v1/team
   *
   * Access: SUPERADMIN / HOSPITAL_OWNER / HOSPITAL_MANAGER
   */
  static async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.hospitalId) {
        res.status(400).json({
          error: { code: 'BAD_REQUEST', message: 'Hospital context required' },
        });
        return;
      }

      const hospitalId = req.user.hospitalId;

      const memberships = await HospitalUser.findAll({
        where: { hospitalId },
        include: [
          { model: User, as: 'user', attributes: ['id', 'email', 'firstName', 'lastName', 'createdAt'] },
          {
            model: Doctor,
            as: 'doctor',
            required: false,
            include: [{ model: Department, as: 'department', attributes: ['id', 'name'], required: false }],
          },
        ],
        order: [['createdAt', 'ASC']],
      });

      const data = memberships.map((m: any) => ({
        userId: m.user?.id,
        email: m.user?.email,
        firstName: m.user?.firstName,
        lastName: m.user?.lastName,
        role: m.role,
        doctorId: m.doctorId || null,
        departmentId: m.departmentId || (m.doctor?.departmentId ?? null),
        departmentName: m.doctor?.department?.name || null,
        createdAt: m.user?.createdAt || null,
      }));

      res.json({ data });
    } catch (error) {
      next(error);
    }
  }
}



