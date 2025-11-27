import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { QueueService } from '../services/QueueService';
import User from '../models/User';
import Doctor from '../models/Doctor';
import Department from '../models/Department';

export class QueueController {
  /**
   * Get queue for doctor
   * GET /api/v1/queue/doctor/:doctorId
   */
  static async getDoctorQueue(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { doctorId } = req.params;

      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      // Get hospitalId from user or from doctor
      let hospitalId = req.user.hospitalId;

      if (!hospitalId) {
        // Try to get from database
        const user = await User.findByPk(req.user.id);
        if (user && user.hospitalId) {
          hospitalId = user.hospitalId;
        } else {
          // Get hospitalId from doctor
          const doctor = await Doctor.findByPk(doctorId);
          if (doctor && doctor.hospitalId) {
            hospitalId = doctor.hospitalId;
            // Verify user has access to this hospital
            if (user && user.hospitalId && user.hospitalId !== hospitalId) {
              res.status(403).json({
                error: {
                  code: 'FORBIDDEN',
                  message: 'Access denied - you do not have access to this hospital',
                },
              });
              return;
            }
          }
        }
      }

      if (!hospitalId) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'Hospital context required',
          },
        });
        return;
      }

      const queue = await QueueService.getQueueForDoctor(hospitalId, doctorId);

      res.json({
        data: queue,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get queue for department
   * GET /api/v1/queue/department/:departmentId
   */
  static async getDepartmentQueue(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { departmentId } = req.params;

      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      // Get hospitalId from user or from department
      let hospitalId = req.user.hospitalId;

      if (!hospitalId) {
        // Try to get from database
        const user = await User.findByPk(req.user.id);
        if (user && user.hospitalId) {
          hospitalId = user.hospitalId;
        } else {
          // Get hospitalId from department
          const department = await Department.findByPk(departmentId);
          if (department && department.hospitalId) {
            hospitalId = department.hospitalId;
            // Verify user has access to this hospital
            if (user && user.hospitalId && user.hospitalId !== hospitalId) {
              res.status(403).json({
                error: {
                  code: 'FORBIDDEN',
                  message: 'Access denied - you do not have access to this hospital',
                },
              });
              return;
            }
          }
        }
      }

      if (!hospitalId) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'Hospital context required',
          },
        });
        return;
      }

      const queue = await QueueService.getQueueForDepartment(hospitalId, departmentId);

      res.json({
        data: queue,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Call next patient
   * POST /api/v1/queue/doctor/:doctorId/next
   */
  static async callNext(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { doctorId } = req.params;

      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      // Get hospitalId from user or from doctor
      let hospitalId = req.user.hospitalId;

      if (!hospitalId) {
        const user = await User.findByPk(req.user.id);
        if (user && user.hospitalId) {
          hospitalId = user.hospitalId;
        } else {
          const doctor = await Doctor.findByPk(doctorId);
          if (doctor && doctor.hospitalId) {
            hospitalId = doctor.hospitalId;
          }
        }
      }

      if (!hospitalId) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'Hospital context required',
          },
        });
        return;
      }

      const visit = await QueueService.callNextPatient(
        hospitalId,
        doctorId,
        req.user.id
      );

      res.json({
        data: visit,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Skip patient
   * POST /api/v1/queue/doctor/:doctorId/skip
   */
  static async skip(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { doctorId } = req.params;
      const { visitId } = req.body;

      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      if (!visitId) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'visitId is required',
          },
        });
        return;
      }

      // Get hospitalId from user or from doctor
      let hospitalId = req.user.hospitalId;

      if (!hospitalId) {
        const user = await User.findByPk(req.user.id);
        if (user && user.hospitalId) {
          hospitalId = user.hospitalId;
        } else {
          const doctor = await Doctor.findByPk(doctorId);
          if (doctor && doctor.hospitalId) {
            hospitalId = doctor.hospitalId;
          }
        }
      }

      if (!hospitalId) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'Hospital context required',
          },
        });
        return;
      }

      await QueueService.skipPatient(hospitalId, doctorId, visitId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Complete visit
   * POST /api/v1/queue/doctor/:doctorId/complete
   */
  static async complete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { doctorId } = req.params;
      const { visitId } = req.body;

      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      if (!visitId) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'visitId is required',
          },
        });
        return;
      }

      // Get hospitalId from user or from doctor
      let hospitalId = req.user.hospitalId;

      if (!hospitalId) {
        const user = await User.findByPk(req.user.id);
        if (user && user.hospitalId) {
          hospitalId = user.hospitalId;
        } else {
          const doctor = await Doctor.findByPk(doctorId);
          if (doctor && doctor.hospitalId) {
            hospitalId = doctor.hospitalId;
          }
        }
      }

      if (!hospitalId) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'Hospital context required',
          },
        });
        return;
      }

      await QueueService.completeVisit(hospitalId, doctorId, visitId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

