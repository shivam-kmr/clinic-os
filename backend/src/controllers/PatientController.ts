import { Request, Response } from 'express';
import { AppointmentService } from '../services/AppointmentService';
import { QueueService } from '../services/QueueService';
import Appointment from '../models/Appointment';
import Visit from '../models/Visit';
import Department from '../models/Department';
import Doctor from '../models/Doctor';
import VisitHistory from '../models/VisitHistory';
import { Op } from 'sequelize';
import { errorHandler } from '../middleware/errorHandler';

export class PatientController {
  /**
   * GET /api/v1/patient/departments
   * Get all departments for the hospital
   */
  static async getDepartments(req: Request, res: Response): Promise<void> {
    try {
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

      const departments = await Department.findAll({
        where: { hospitalId },
        attributes: ['id', 'name', 'description'],
        order: [['name', 'ASC']],
      });

      res.json({ departments });
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * GET /api/v1/patient/doctors
   * Get all doctors for the hospital (optionally filtered by department)
   */
  static async getDoctors(req: Request, res: Response): Promise<void> {
    try {
      const hospitalId = req.hospitalContext?.id;
      const departmentId = req.query.departmentId as string | undefined;

      if (!hospitalId) {
        res.status(400).json({
          error: {
            code: 'HOSPITAL_CONTEXT_REQUIRED',
            message: 'Hospital context is required',
          },
        });
        return;
      }

      const where: any = {
        hospitalId,
        status: 'ACTIVE',
      };

      if (departmentId) {
        where.departmentId = departmentId;
      }

      const doctors = await Doctor.findAll({
        where,
        include: [
          {
            model: Department,
            as: 'department',
            attributes: ['id', 'name'],
          },
        ],
        attributes: ['id', 'firstName', 'lastName', 'specialization', 'qualifications'],
        order: [['firstName', 'ASC']],
      });

      res.json({ doctors });
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * GET /api/v1/patient/doctors/:doctorId
   * Get doctor details
   */
  static async getDoctor(req: Request, res: Response): Promise<void> {
    try {
      const { doctorId } = req.params;
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

      const doctor = await Doctor.findOne({
        where: {
          id: doctorId,
          hospitalId,
          status: 'ACTIVE',
        },
        include: [
          {
            model: Department,
            as: 'department',
            attributes: ['id', 'name'],
          },
        ],
        attributes: ['id', 'firstName', 'lastName', 'specialization', 'qualifications'],
      });

      if (!doctor) {
        res.status(404).json({
          error: {
            code: 'DOCTOR_NOT_FOUND',
            message: 'Doctor not found',
          },
        });
        return;
      }

      res.json({ doctor });
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * POST /api/v1/patient/appointments
   * Create a new appointment
   */
  static async createAppointment(req: Request, res: Response): Promise<void> {
    try {
      const patientUser = (req as any).patientUser;
      const hospitalId = req.hospitalContext?.id;

      if (!patientUser || !hospitalId) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const { doctorId, departmentId, scheduledAt, type } = req.body;

      if (!scheduledAt || !type) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'scheduledAt and type are required',
          },
        });
        return;
      }

      if (!doctorId && !departmentId) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Either doctorId or departmentId is required',
          },
        });
        return;
      }

      const appointment = await AppointmentService.createAppointment({
        patientId: patientUser.patientId,
        hospitalId,
        doctorId,
        departmentId,
        scheduledAt: new Date(scheduledAt),
        bookingType: type === 'TOKEN' ? 'WALK_IN' : 'ONLINE',
      });

      res.status(201).json({ appointment });
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * GET /api/v1/patient/appointments
   * Get patient's appointments
   */
  static async getMyAppointments(req: Request, res: Response): Promise<void> {
    try {
      const patientUser = (req as any).patientUser;
      const hospitalId = req.hospitalContext?.id;
      const status = req.query.status as string | undefined;

      if (!patientUser || !hospitalId) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const where: any = {
        patientId: patientUser.patientId,
        hospitalId,
      };

      if (status) {
        where.status = status;
      }

      const appointments = await Appointment.findAll({
        where,
        include: [
          {
            model: Doctor,
            as: 'doctor',
            attributes: ['id', 'firstName', 'lastName', 'specialization'],
            required: false,
          },
          {
            model: Department,
            as: 'department',
            attributes: ['id', 'name'],
            required: false,
          },
        ],
        order: [['scheduledAt', 'DESC']],
      });

      res.json({ appointments });
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * GET /api/v1/patient/appointments/:appointmentId
   * Get a specific appointment
   */
  static async getAppointment(req: Request, res: Response): Promise<void> {
    try {
      const patientUser = (req as any).patientUser;
      const { appointmentId } = req.params;

      if (!patientUser) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const appointment = await Appointment.findOne({
        where: {
          id: appointmentId,
          patientId: patientUser.patientId,
        },
        include: [
          {
            model: Doctor,
            as: 'doctor',
            attributes: ['id', 'firstName', 'lastName', 'specialization'],
            required: false,
          },
          {
            model: Department,
            as: 'department',
            attributes: ['id', 'name'],
            required: false,
          },
          {
            model: Visit,
            as: 'visit',
            required: false,
          },
        ],
      });

      if (!appointment) {
        res.status(404).json({
          error: {
            code: 'APPOINTMENT_NOT_FOUND',
            message: 'Appointment not found',
          },
        });
        return;
      }

      res.json({ appointment });
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * PATCH /api/v1/patient/appointments/:appointmentId/cancel
   * Cancel an appointment
   */
  static async cancelAppointment(req: Request, res: Response): Promise<void> {
    try {
      const patientUser = (req as any).patientUser;
      const { appointmentId } = req.params;

      if (!patientUser) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      await AppointmentService.cancelAppointment(appointmentId, patientUser.patientId);

      res.json({ message: 'Appointment cancelled successfully' });
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * PATCH /api/v1/patient/appointments/:appointmentId/reschedule
   * Reschedule an appointment
   */
  static async rescheduleAppointment(req: Request, res: Response): Promise<void> {
    try {
      const patientUser = (req as any).patientUser;
      const { appointmentId } = req.params;
      const { scheduledAt } = req.body;

      if (!patientUser) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      if (!scheduledAt) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'scheduledAt is required',
          },
        });
        return;
      }

      const appointment = await AppointmentService.rescheduleAppointment(
        appointmentId,
        patientUser.patientId,
        new Date(scheduledAt)
      );

      res.json({ appointment });
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * GET /api/v1/patient/queue-position
   * Get patient's current queue position
   */
  static async getQueuePosition(req: Request, res: Response): Promise<void> {
    try {
      const patientUser = (req as any).patientUser;
      const hospitalId = req.hospitalContext?.id;

      if (!patientUser || !hospitalId) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      // Find active visit for this patient
      const visit: any = await Visit.findOne({
        where: {
          patientId: patientUser.patientId,
          hospitalId,
          status: {
            [Op.in]: ['WAITING', 'CHECKED_IN', 'IN_PROGRESS'],
          },
        },
        include: [
          {
            model: Doctor,
            as: 'doctor',
            attributes: ['id', 'firstName', 'lastName'],
            required: false,
          },
          {
            model: Department,
            as: 'department',
            attributes: ['id', 'name'],
            required: false,
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      if (!visit) {
        res.json({
          inQueue: false,
          message: 'No active visit found',
        });
        return;
      }

      // Get queue position
      let position = 0;
      let estimatedWaitTime = null;

      if (visit.doctorId) {
        const queueResponse = await QueueService.getQueueForDoctor(visit.doctorId, hospitalId);
        position = queueResponse.queue.findIndex((v: any) => v.id === visit.id) + 1;
        estimatedWaitTime = queueResponse.queue[0]?.estimatedWaitTime || null;
      } else if (visit.departmentId) {
        const queueResponse = await QueueService.getQueueForDepartment(visit.departmentId, hospitalId);
        position = queueResponse.queue.findIndex((v: any) => v.id === visit.id) + 1;
        estimatedWaitTime = queueResponse.queue[0]?.estimatedWaitTime || null;
      }

      res.json({
        inQueue: true,
        visit: {
          id: visit.id,
          tokenNumber: visit.tokenNumber,
          status: visit.status,
          position: position > 0 ? position : null,
          estimatedWaitTime,
          doctor: visit.doctor
            ? {
                id: visit.doctor.id,
                name: `${visit.doctor.firstName} ${visit.doctor.lastName}`,
              }
            : null,
          department: visit.department
            ? {
                id: visit.department.id,
                name: visit.department.name,
              }
            : null,
        },
      });
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * GET /api/v1/patient/history
   * Get patient's visit history
   */
  static async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const patientUser = (req as any).patientUser;
      const hospitalId = req.hospitalContext?.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!patientUser || !hospitalId) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const visits = await VisitHistory.findAndCountAll({
        where: {
          patientId: patientUser.patientId,
          hospitalId,
        },
        include: [
          {
            model: Doctor,
            as: 'doctor',
            attributes: ['id', 'firstName', 'lastName', 'specialization'],
            required: false,
          },
          {
            model: Department,
            as: 'department',
            attributes: ['id', 'name'],
            required: false,
          },
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset: (page - 1) * limit,
      });

      res.json({
        visits: visits.rows,
        pagination: {
          page,
          limit,
          total: visits.count,
          totalPages: Math.ceil(visits.count / limit),
        },
      });
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }
}

