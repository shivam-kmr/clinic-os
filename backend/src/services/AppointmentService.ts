import { Op, Transaction } from 'sequelize';
import '../models'; // Import to initialize associations
import Appointment from '../models/Appointment';
import Visit from '../models/Visit';
import Patient from '../models/Patient';
import Doctor from '../models/Doctor';
import Department from '../models/Department';
import HospitalConfig from '../models/HospitalConfig';
import { logger } from '../config/logger';
import { DoctorAssignmentService } from './DoctorAssignmentService';
import { getNextTokenNumber } from '../utils/tokenNumber';
import { publishEvent } from '../config/rabbitmq';
import sequelize from '../config/database';
import { addMinutes, isBefore, isAfter } from 'date-fns';

export interface CreateAppointmentDto {
  hospitalId: string;
  patientId: string;
  departmentId?: string;
  doctorId?: string;
  scheduledAt: Date;
  bookingType: 'ONLINE' | 'WALK_IN';
  notes?: string;
}

/**
 * Service for managing appointments
 */
export class AppointmentService {
  /**
   * Create a new appointment
   */
  static async createAppointment(data: CreateAppointmentDto): Promise<Appointment> {
    // Validate: cannot book in the past
    if (isBefore(data.scheduledAt, new Date())) {
      throw new Error('Cannot book appointments in the past');
    }

    // Validate: either departmentId or doctorId must be provided
    if (!data.departmentId && !data.doctorId) {
      throw new Error('Either departmentId or doctorId must be provided');
    }

    // Check for double-booking if doctor is specified
    if (data.doctorId) {
      const existing = await Appointment.findOne({
        where: {
          hospitalId: data.hospitalId,
          doctorId: data.doctorId,
          scheduledAt: data.scheduledAt,
          status: {
            [Op.notIn]: ['CANCELLED', 'NO_SHOW'],
          },
        },
      });

      if (existing) {
        throw new Error('Doctor is already booked at this time');
      }
    }

    const appointment = await Appointment.create({
      ...data,
      status: 'PENDING',
    });

    // Publish event
    await publishEvent('appointment.created', {
      appointmentId: appointment.id,
      hospitalId: data.hospitalId,
      timestamp: new Date().toISOString(),
    });

    logger.info(`Created appointment ${appointment.id} for patient ${data.patientId}`);
    return appointment;
  }

  /**
   * Check-in an online appointment (creates a visit)
   */
  static async checkInAppointment(
    hospitalId: string,
    appointmentId: string
  ): Promise<Visit> {
    const appointment = await Appointment.findOne({
      where: {
        id: appointmentId,
        hospitalId,
      },
      include: [
        {
          model: Patient,
          as: 'patient',
        },
      ],
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    if (appointment.status === 'CANCELLED') {
      throw new Error('Cannot check in a cancelled appointment');
    }

    if (appointment.status === 'COMPLETED') {
      throw new Error('Appointment already completed');
    }

    // Check if already checked in
    const existingVisit = await Visit.findOne({
      where: {
        appointmentId,
        hospitalId,
      },
    });

    if (existingVisit) {
      throw new Error('Appointment already checked in');
    }

    // Get hospital config
    const config = await HospitalConfig.findOne({
      where: { hospitalId },
    });

    const arrivalWindow = config?.arrivalWindowBeforeAppointment || 15;
    const arrivalStart = addMinutes(appointment.scheduledAt, -arrivalWindow);
    const now = new Date();

    // Check if within arrival window
    if (isBefore(now, arrivalStart)) {
      throw new Error(`Check-in is only allowed ${arrivalWindow} minutes before appointment time`);
    }

    // Assign doctor if department-level appointment
    let doctorId = appointment.doctorId;
    if (!doctorId && appointment.departmentId) {
      doctorId = await DoctorAssignmentService.assignDoctorForDepartmentVisit(
        hospitalId,
        appointment.departmentId,
        now
      );
    }

    if (!doctorId) {
      throw new Error('Could not assign doctor');
    }

    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor) {
      throw new Error('Doctor not found');
    }

    // Get token number
    const tokenResetFrequency = config?.tokenResetFrequency || 'DAILY';
    const tokenNumber = await getNextTokenNumber(
      hospitalId,
      doctorId,
      tokenResetFrequency
    );

    // Create visit
    const visit = await Visit.create({
      hospitalId,
      patientId: appointment.patientId,
      appointmentId: appointment.id,
      doctorId,
      departmentId: doctor.departmentId,
      tokenNumber,
      status: 'CHECKED_IN',
      priority: 'NORMAL',
      checkedInAt: now,
      isCarryover: false,
    });

    // Update appointment status
    appointment.status = 'CONFIRMED';
    await appointment.save();

    // Publish events
    await publishEvent('visit.created', {
      visitId: visit.id,
      hospitalId,
      doctorId,
      departmentId: doctor.departmentId,
      timestamp: new Date().toISOString(),
    });

    await publishEvent('appointment.checked_in', {
      appointmentId: appointment.id,
      visitId: visit.id,
      hospitalId,
      timestamp: new Date().toISOString(),
    });

    logger.info(`Checked in appointment ${appointmentId}, created visit ${visit.id}`);
    return visit;
  }

  /**
   * Cancel an appointment
   */
  static async cancelAppointment(
    hospitalId: string,
    appointmentId: string,
    userId?: string
  ): Promise<void> {
    const appointment = await Appointment.findOne({
      where: {
        id: appointmentId,
        hospitalId,
      },
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    if (appointment.status === 'CANCELLED') {
      throw new Error('Appointment already cancelled');
    }

    if (appointment.status === 'COMPLETED') {
      throw new Error('Cannot cancel a completed appointment');
    }

    appointment.status = 'CANCELLED';
    await appointment.save();

    // Cancel associated visit if exists
    const visit = await Visit.findOne({
      where: {
        appointmentId,
        hospitalId,
        status: {
          [Op.in]: ['WAITING', 'CHECKED_IN'],
        },
      },
    });

    if (visit) {
      visit.status = 'CANCELLED';
      await visit.save();
    }

    // Publish event
    await publishEvent('appointment.cancelled', {
      appointmentId: appointment.id,
      hospitalId,
      cancelledBy: userId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Reschedule an appointment
   */
  static async rescheduleAppointment(
    hospitalId: string,
    appointmentId: string,
    newScheduledAt: Date
  ): Promise<Appointment> {
    if (isBefore(newScheduledAt, new Date())) {
      throw new Error('Cannot reschedule to a past time');
    }

    const appointment = await Appointment.findOne({
      where: {
        id: appointmentId,
        hospitalId,
      },
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    if (appointment.status === 'CANCELLED') {
      throw new Error('Cannot reschedule a cancelled appointment');
    }

    if (appointment.status === 'COMPLETED') {
      throw new Error('Cannot reschedule a completed appointment');
    }

    // Check for double-booking
    if (appointment.doctorId) {
      const existing = await Appointment.findOne({
        where: {
          hospitalId,
          doctorId: appointment.doctorId,
          scheduledAt: newScheduledAt,
          id: {
            [Op.ne]: appointmentId,
          },
          status: {
            [Op.notIn]: ['CANCELLED', 'NO_SHOW'],
          },
        },
      });

      if (existing) {
        throw new Error('Doctor is already booked at the new time');
      }
    }

    const oldScheduledAt = appointment.scheduledAt;
    appointment.scheduledAt = newScheduledAt;
    await appointment.save();

    // Publish event
    await publishEvent('appointment.rescheduled', {
      appointmentId: appointment.id,
      hospitalId,
      oldScheduledAt: oldScheduledAt.toISOString(),
      newScheduledAt: newScheduledAt.toISOString(),
      timestamp: new Date().toISOString(),
    });

    return appointment;
  }

  /**
   * Mark no-show appointments (called when doctor presses next and patient didn't check in)
   */
  static async markNoShow(
    hospitalId: string,
    appointmentId: string
  ): Promise<void> {
    const appointment = await Appointment.findOne({
      where: {
        id: appointmentId,
        hospitalId,
      },
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    appointment.status = 'NO_SHOW';
    await appointment.save();

    // Publish event
    await publishEvent('appointment.no_show', {
      appointmentId: appointment.id,
      hospitalId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get appointments for a doctor
   */
  static async getAppointmentsForDoctor(
    hospitalId: string,
    doctorId: string,
    date?: Date
  ): Promise<Appointment[]> {
    const where: any = {
      hospitalId,
      doctorId,
      status: {
        [Op.notIn]: ['CANCELLED'],
      },
    };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      where.scheduledAt = {
        [Op.between]: [startOfDay, endOfDay],
      };
    }

    return Appointment.findAll({
      where,
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'phone'],
        },
      ],
      order: [['scheduledAt', 'ASC']],
    });
  }

  /**
   * Get appointments for a patient
   */
  static async getAppointmentsForPatient(
    hospitalId: string,
    patientId: string
  ): Promise<Appointment[]> {
    return Appointment.findAll({
      where: {
        hospitalId,
        patientId,
      },
      include: [
        {
          model: Doctor,
          as: 'doctor',
          attributes: ['id', 'specialization'],
          include: [
            {
              model: Department,
              as: 'department',
              attributes: ['id', 'name'],
            },
          ],
        },
        {
          model: require('../models/Department').default,
          as: 'department',
          attributes: ['id', 'name'],
        },
      ],
      order: [['scheduledAt', 'DESC']],
    });
  }
}

