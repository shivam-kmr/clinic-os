import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import realtimeService from '../services/RealtimeService';
import Doctor from '../models/Doctor';
import Department from '../models/Department';

export class SSEController {
  /**
   * SSE for reception dashboard
   * GET /api/v1/sse/reception/:hospitalId
   */
  static async reception(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { hospitalId } = req.params;

      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      // Verify access
      // SUPERADMIN can access any hospital
      // Other users must have hospitalId matching the route parameter
      if (req.user.role !== 'SUPERADMIN') {
        // Fetch user from database to get actual hospitalId
        const User = (await import('../models/User')).default;
        const user = await User.findByPk(req.user.id);
        
        if (!user) {
          res.status(401).json({
            error: {
              code: 'UNAUTHORIZED',
              message: 'User not found',
            },
          });
          return;
        }

        // Verify user has access to this hospital
        // If user's hospitalId is null in DB, they shouldn't have access
        // But if it matches the route parameter, allow it
        if (user.hospitalId && user.hospitalId !== hospitalId) {
          res.status(403).json({
            error: {
              code: 'FORBIDDEN',
              message: 'Access denied - you do not have access to this hospital',
            },
          });
          return;
        }

        // If user's hospitalId is null in DB but route param is provided,
        // this might be a user created via OAuth without hospitalId
        // For now, we'll allow it but log a warning
        if (!user.hospitalId) {
          // User doesn't have a hospitalId assigned - this shouldn't happen for normal users
          // But we'll allow it for now and let them access the hospital
          // In production, you might want to require hospital assignment
          console.warn(`User ${user.id} accessing hospital ${hospitalId} without assigned hospitalId`);
        }
      }

      await realtimeService.setupReceptionSSE(res, hospitalId);
    } catch (error) {
      next(error);
    }
  }

  /**
   * SSE for doctor screen
   * GET /api/v1/sse/doctor/:doctorId
   */
  static async doctor(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { doctorId } = req.params;

      if (!req.user?.hospitalId) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'Hospital context required',
          },
        });
        return;
      }

      // Verify doctor belongs to hospital
      const doctor = await Doctor.findByPk(doctorId);

      if (!doctor || doctor.hospitalId !== req.user.hospitalId) {
        res.status(404).json({
          error: {
            code: 'DOCTOR_NOT_FOUND',
            message: 'Doctor not found',
          },
        });
        return;
      }

      await realtimeService.setupDoctorSSE(res, req.user.hospitalId, doctorId);
    } catch (error) {
      next(error);
    }
  }

  /**
   * SSE for waiting room (public view)
   * GET /api/v1/sse/waiting-room/:departmentId
   */
  static async waitingRoom(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { departmentId } = req.params;

      // Verify department exists
      const department = await Department.findByPk(departmentId);

      if (!department) {
        res.status(404).json({
          error: {
            code: 'DEPARTMENT_NOT_FOUND',
            message: 'Department not found',
          },
        });
        return;
      }

      // If user is authenticated, verify they have access to this hospital
      if (req.user?.hospitalId && req.user.hospitalId !== department.hospitalId) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied',
          },
        });
        return;
      }

      // Public access - use department's hospitalId
      await realtimeService.setupWaitingRoomSSE(res, department.hospitalId, departmentId);
    } catch (error) {
      next(error);
    }
  }
}

