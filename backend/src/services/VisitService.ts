import Visit from '../models/Visit';
import Patient from '../models/Patient';
import Doctor from '../models/Doctor';
import Department from '../models/Department';
import HospitalConfig from '../models/HospitalConfig';
import { ConfigResolverService } from './ConfigResolverService';
import { logger } from '../config/logger';
import { DoctorAssignmentService } from './DoctorAssignmentService';
import { getNextTokenNumber } from '../utils/tokenNumber';
import { publishEvent } from '../config/rabbitmq';
import { calculateEstimatedWaitTime } from '../utils/queueOrdering';
import { Op } from 'sequelize';

export interface CreateWalkInVisitDto {
  hospitalId: string;
  patientId: string;
  departmentId?: string;
  doctorId?: string;
  priority?: 'NORMAL' | 'VIP' | 'URGENT';
}

/**
 * Service for managing visits (walk-ins)
 */
export class VisitService {
  /**
   * Create a walk-in visit
   */
  static async createWalkInVisit(data: CreateWalkInVisitDto): Promise<Visit> {
    const { hospitalId, patientId, departmentId, doctorId, priority = 'NORMAL' } = data;

    // Validate: either departmentId or doctorId must be provided
    if (!departmentId && !doctorId) {
      throw new Error('Either departmentId or doctorId must be provided');
    }

    // Resolve config: department overrides hospital defaults
    const resolvedDeptId = departmentId || null;
    const config = resolvedDeptId
      ? await ConfigResolverService.getEffectiveDepartmentConfig(hospitalId, resolvedDeptId)
      : null;
    const hospitalConfig = await HospitalConfig.findOne({ where: { hospitalId } });

    // Check queue length limit (soft limit - warn but allow)
    const maxQueueLength = (config as any)?.maxQueueLength ?? hospitalConfig?.maxQueueLength;
    if (maxQueueLength) {
      const currentQueueLength = doctorId
        ? await Visit.count({
            where: {
              hospitalId,
              doctorId,
              status: {
                [Op.in]: ['WAITING', 'CHECKED_IN', 'ON_HOLD'],
              },
            },
          })
        : await Visit.count({
            where: {
              hospitalId,
              departmentId,
              status: {
                [Op.in]: ['WAITING', 'CHECKED_IN', 'ON_HOLD'],
              },
            },
          });

      if (currentQueueLength >= maxQueueLength) {
        logger.warn(
          `Queue length limit reached for ${doctorId || departmentId}, but allowing new visit`
        );
      }
    }

    // Assign doctor if department-level visit
    let assignedDoctorId = doctorId;
    if (!assignedDoctorId && departmentId) {
      // Check if doctor is at capacity
      const availableDoctors = await DoctorAssignmentService.getAvailableDoctors(
        hospitalId,
        departmentId
      );

      if (availableDoctors.length === 0) {
        throw new Error('No available doctors in this department');
      }

      // Try to find a doctor not at capacity
      let foundDoctor = false;
      for (const doctor of availableDoctors) {
        const atCapacity = await DoctorAssignmentService.isDoctorAtCapacity(doctor.id);
        if (!atCapacity) {
          assignedDoctorId = doctor.id;
          foundDoctor = true;
          break;
        }
      }

      // If all doctors at capacity, queue for next day (assign to least busy)
      if (!foundDoctor) {
        logger.warn('All doctors at capacity, assigning to least busy doctor for next day');
        assignedDoctorId = await DoctorAssignmentService.assignDoctorForDepartmentVisit(
          hospitalId,
          departmentId
        );
      } else {
        assignedDoctorId = await DoctorAssignmentService.assignDoctorForDepartmentVisit(
          hospitalId,
          departmentId
        );
      }
    }

    if (!assignedDoctorId) {
      throw new Error('Could not assign doctor');
    }

    const doctor = await Doctor.findByPk(assignedDoctorId);
    if (!doctor) {
      throw new Error('Doctor not found');
    }

    // Check if doctor is at capacity
    const atCapacity = await DoctorAssignmentService.isDoctorAtCapacity(assignedDoctorId);
    if (atCapacity) {
      logger.warn(`Doctor ${assignedDoctorId} is at capacity, but creating visit for next day`);
    }

    // Get token number
    const tokenResetFrequency =
      (config as any)?.tokenResetFrequency || hospitalConfig?.tokenResetFrequency || 'DAILY';
    const tokenNumber = await getNextTokenNumber(
      hospitalId,
      assignedDoctorId,
      tokenResetFrequency
    );

    // Create visit
    const visit = await Visit.create({
      hospitalId,
      patientId,
      appointmentId: null,
      doctorId: assignedDoctorId,
      departmentId: doctor.departmentId,
      tokenNumber,
      status: 'CHECKED_IN', // Walk-ins are automatically checked in
      priority,
      checkedInAt: new Date(),
      isCarryover: false,
    });

    // Calculate estimated wait time
    const consultationDuration =
      doctor.consultationDuration ||
      (config as any)?.defaultConsultationDuration ||
      hospitalConfig?.defaultConsultationDuration ||
      15;
    
    const queueAhead = await Visit.findAll({
      where: {
        hospitalId,
        doctorId: assignedDoctorId,
        status: {
          [Op.in]: ['WAITING', 'CHECKED_IN', 'ON_HOLD', 'CARRYOVER'],
        },
        id: {
          [Op.ne]: visit.id,
        },
      },
      order: [['checkedInAt', 'ASC']],
    });

    visit.estimatedWaitTime = calculateEstimatedWaitTime(visit, queueAhead, consultationDuration);
    await visit.save();

    // Publish event
    await publishEvent('visit.created', {
      visitId: visit.id,
      hospitalId,
      doctorId: assignedDoctorId,
      departmentId: doctor.departmentId,
      timestamp: new Date().toISOString(),
    });

    logger.info(`Created walk-in visit ${visit.id} for patient ${patientId}`);
    return visit;
  }

  /**
   * Update visit status
   */
  static async updateVisitStatus(
    hospitalId: string,
    visitId: string,
    status: Visit['status'],
    _notes?: string
  ): Promise<Visit> {
    const visit = await Visit.findOne({
      where: {
        id: visitId,
        hospitalId,
      },
    });

    if (!visit) {
      throw new Error('Visit not found');
    }

    // Validate status transition
    if (visit.status === 'COMPLETED' && status !== 'COMPLETED') {
      throw new Error('Cannot change status of a completed visit');
    }

    if (visit.status === 'IN_PROGRESS' && status === 'CANCELLED') {
      throw new Error('Cannot cancel a visit that is in progress');
    }

    const oldStatus = visit.status;
    visit.status = status;

    if (status === 'IN_PROGRESS' && !visit.startedAt) {
      visit.startedAt = new Date();
    }

    if (status === 'COMPLETED' && !visit.completedAt) {
      visit.completedAt = new Date();
    }

    await visit.save();

    // Publish event
    await publishEvent('visit.status.changed', {
      visitId: visit.id,
      hospitalId,
      doctorId: visit.doctorId,
      oldStatus,
      newStatus: status,
      timestamp: new Date().toISOString(),
    });

    return visit;
  }

  /**
   * Get visit by ID
   */
  static async getVisitById(
    hospitalId: string,
    visitId: string
  ): Promise<Visit | null> {
    return Visit.findOne({
      where: {
        id: visitId,
        hospitalId,
      },
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'phone'],
        },
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
      ],
    });
  }
}

