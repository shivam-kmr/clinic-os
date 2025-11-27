import { Response, NextFunction } from 'express';
import '../models'; // Import to initialize associations
import { AuthRequest } from '../middleware/auth';
import { AppointmentService } from '../services/AppointmentService';
import Appointment from '../models/Appointment';
import Patient from '../models/Patient';
import Doctor from '../models/Doctor';
import Department from '../models/Department';

export class AppointmentController {
  /**
   * Create appointment
   * POST /api/v1/appointments
   */
  static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { patientId, departmentId, doctorId, scheduledAt, bookingType, notes } = req.body;

      if (!req.user?.hospitalId) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'Hospital context required',
          },
        });
        return;
      }

      const appointment = await AppointmentService.createAppointment({
        hospitalId: req.user.hospitalId,
        patientId,
        departmentId,
        doctorId,
        scheduledAt: new Date(scheduledAt),
        bookingType: bookingType || 'ONLINE',
        notes,
      });

      res.status(201).json({
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get appointments
   * GET /api/v1/appointments
   */
  static async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { doctorId, patientId, date, page = 1, limit = 20 } = req.query;

      if (!req.user?.hospitalId) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'Hospital context required',
          },
        });
        return;
      }

      let appointments;

      if (doctorId) {
        appointments = await AppointmentService.getAppointmentsForDoctor(
          req.user.hospitalId,
          doctorId as string,
          date ? new Date(date as string) : undefined
        );
      } else if (patientId) {
        appointments = await AppointmentService.getAppointmentsForPatient(
          req.user.hospitalId,
          patientId as string
        );
      } else {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'Either doctorId or patientId must be provided',
          },
        });
        return;
      }

      // Simple pagination
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const start = (pageNum - 1) * limitNum;
      const end = start + limitNum;
      const paginatedAppointments = appointments.slice(start, end);

      res.json({
        data: paginatedAppointments,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: appointments.length,
          totalPages: Math.ceil(appointments.length / limitNum),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get appointment by ID
   * GET /api/v1/appointments/:id
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

      const appointment = await Appointment.findOne({
        where: {
          id,
          hospitalId: req.user.hospitalId,
        },
        include: [
          {
            model: Patient,
            as: 'patient',
          },
          {
            model: Doctor,
            as: 'doctor',
            include: [
              {
                model: Department,
                as: 'department',
              },
            ],
          },
          {
            model: Department,
            as: 'department',
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

      res.json({
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check-in appointment
   * POST /api/v1/appointments/:id/check-in
   */
  static async checkIn(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
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

      const visit = await AppointmentService.checkInAppointment(
        req.user.hospitalId,
        id
      );

      res.status(201).json({
        data: visit,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel appointment
   * DELETE /api/v1/appointments/:id
   */
  static async cancel(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
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

      await AppointmentService.cancelAppointment(
        req.user.hospitalId,
        id,
        req.user.id
      );

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reschedule appointment
   * PATCH /api/v1/appointments/:id/reschedule
   */
  static async reschedule(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { scheduledAt } = req.body;

      if (!req.user?.hospitalId) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'Hospital context required',
          },
        });
        return;
      }

      const appointment = await AppointmentService.rescheduleAppointment(
        req.user.hospitalId,
        id,
        new Date(scheduledAt)
      );

      res.json({
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  }
}

