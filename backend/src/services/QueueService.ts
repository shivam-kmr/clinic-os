import { Op } from 'sequelize';
import '../models'; // Import to initialize associations
import Visit from '../models/Visit';
import Doctor from '../models/Doctor';
import Patient from '../models/Patient';
import Department from '../models/Department';
import HospitalConfig from '../models/HospitalConfig';
import VisitHistory from '../models/VisitHistory';
import { logger } from '../config/logger';
import { getNextTokenNumber } from '../utils/tokenNumber';
import { sortQueueByPriority, calculateEstimatedWaitTime } from '../utils/queueOrdering';
import { getQueueLockKey, withLock } from '../utils/redisLock';
import { publishEvent } from '../config/rabbitmq';
import { differenceInMinutes } from 'date-fns';
import { ConfigResolverService } from './ConfigResolverService';

export interface QueueItem {
  id: string;
  tokenNumber: number;
  patientId: string;
  patientName: string;
  status: string;
  priority: string;
  checkedInAt: Date;
  estimatedWaitTime: number | null;
  isCarryover: boolean;
}

export interface QueueResponse {
  doctorId?: string;
  departmentId?: string;
  queue: QueueItem[];
  totalCount: number;
}

/**
 * Service for managing queue operations
 */
export class QueueService {
  /**
   * Get current queue for a doctor
   */
  static async getQueueForDoctor(
    hospitalId: string,
    doctorId: string
  ): Promise<QueueResponse> {
    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor || doctor.hospitalId !== hospitalId) {
      throw new Error('Doctor not found');
    }

    const hospitalConfig = await HospitalConfig.findOne({ where: { hospitalId } });
    const deptCfg = await ConfigResolverService.getEffectiveDepartmentConfig(
      hospitalId,
      doctor.departmentId
    );

    const consultationDuration =
      doctor.consultationDuration ||
      deptCfg.defaultConsultationDuration ||
      hospitalConfig?.defaultConsultationDuration ||
      15;

    const visits = await Visit.findAll({
      where: {
        hospitalId,
        doctorId,
        status: {
          [Op.in]: ['WAITING', 'CHECKED_IN', 'IN_PROGRESS', 'ON_HOLD', 'CARRYOVER'],
        },
      },
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName'],
        },
      ],
      order: [['checkedInAt', 'ASC']],
    });

    // Sort by priority
    const sortedVisits = sortQueueByPriority(visits);

    const queue: QueueItem[] = sortedVisits.map((visit: any, index) => {
      const queueAhead = sortedVisits.slice(0, index);
      const estimatedWaitTime = calculateEstimatedWaitTime(
        visit,
        queueAhead,
        consultationDuration
      );

      return {
        id: visit.id,
        tokenNumber: visit.tokenNumber,
        patientId: visit.patientId,
        patientName: visit.patient ? `${visit.patient.firstName} ${visit.patient.lastName}` : 'Unknown',
        status: visit.status,
        priority: visit.priority,
        checkedInAt: visit.checkedInAt,
        estimatedWaitTime,
        isCarryover: visit.isCarryover,
      };
    });

    return {
      doctorId,
      queue,
      totalCount: queue.length,
    };
  }

  /**
   * Get current queue for a department
   */
  static async getQueueForDepartment(
    hospitalId: string,
    departmentId: string
  ): Promise<QueueResponse> {
    const hospitalConfig = await HospitalConfig.findOne({ where: { hospitalId } });
    const deptCfg = await ConfigResolverService.getEffectiveDepartmentConfig(
      hospitalId,
      departmentId
    );

    const defaultConsultationDuration =
      deptCfg.defaultConsultationDuration || hospitalConfig?.defaultConsultationDuration || 15;

    const visits = await Visit.findAll({
      where: {
        hospitalId,
        departmentId,
        status: {
          [Op.in]: ['WAITING', 'CHECKED_IN', 'IN_PROGRESS', 'ON_HOLD', 'CARRYOVER'],
        },
      },
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName'],
        },
      ],
      order: [['checkedInAt', 'ASC']],
    });

    const sortedVisits = sortQueueByPriority(visits);

    const queue: QueueItem[] = sortedVisits.map((visit: any, index) => {
      const queueAhead = sortedVisits.slice(0, index);
      const estimatedWaitTime = calculateEstimatedWaitTime(
        visit,
        queueAhead,
        defaultConsultationDuration
      );

      return {
        id: visit.id,
        tokenNumber: visit.tokenNumber,
        patientId: visit.patientId,
        patientName: visit.patient ? `${visit.patient.firstName} ${visit.patient.lastName}` : 'Unknown',
        status: visit.status,
        priority: visit.priority,
        checkedInAt: visit.checkedInAt,
        estimatedWaitTime,
        isCarryover: visit.isCarryover,
      };
    });

    return {
      departmentId,
      queue,
      totalCount: queue.length,
    };
  }

  /**
   * Call next patient for a doctor (with locking)
   */
  static async callNextPatient(
    hospitalId: string,
    doctorId: string,
    _userId: string
  ): Promise<Visit> {
    const lockKey = getQueueLockKey(hospitalId, doctorId);

    return withLock(lockKey, async () => {
      // Check if there's already a patient in progress
      const inProgress = await Visit.findOne({
        where: {
          hospitalId,
          doctorId,
          status: 'IN_PROGRESS',
        },
      });

      if (inProgress) {
        throw new Error('A patient is already in progress. Please complete or skip the current patient first.');
      }

      // Get next patient from queue
      const queue = await this.getQueueForDoctor(hospitalId, doctorId);
      
      if (queue.queue.length === 0) {
        throw new Error('No patients in queue');
      }

      const nextPatient = queue.queue[0];
      const visit = await Visit.findByPk(nextPatient.id);

      if (!visit) {
        throw new Error('Visit not found');
      }

      // Update visit status
      visit.status = 'IN_PROGRESS';
      visit.startedAt = new Date();
      await visit.save();

      // Publish event
      await publishEvent('visit.status.changed', {
        visitId: visit.id,
        hospitalId,
        doctorId,
        status: 'IN_PROGRESS',
        timestamp: new Date().toISOString(),
      });

      logger.info(`Doctor ${doctorId} called next patient: ${visit.id}`);
      return visit;
    });
  }

  /**
   * Skip current patient
   */
  static async skipPatient(
    hospitalId: string,
    doctorId: string,
    visitId: string
  ): Promise<void> {
    const visit = await Visit.findOne({
      where: {
        id: visitId,
        hospitalId,
        doctorId,
      },
    });

    if (!visit) {
      throw new Error('Visit not found');
    }

    visit.status = 'SKIPPED';
    await visit.save();

    // Move to history
    await this.moveToHistory(visit);

    // Publish event
    await publishEvent('visit.status.changed', {
      visitId: visit.id,
      hospitalId,
      doctorId,
      status: 'SKIPPED',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Complete a visit
   */
  static async completeVisit(
    hospitalId: string,
    doctorId: string,
    visitId: string
  ): Promise<void> {
    const visit = await Visit.findOne({
      where: {
        id: visitId,
        hospitalId,
        doctorId,
      },
    });

    if (!visit) {
      throw new Error('Visit not found');
    }

    visit.status = 'COMPLETED';
    visit.completedAt = new Date();

    // Calculate actual wait time and consultation duration
    if (visit.startedAt && visit.completedAt) {
      const waitTime = differenceInMinutes(visit.startedAt, visit.checkedInAt);
      // consultationDuration calculated but stored in VisitHistory
      
      visit.estimatedWaitTime = waitTime;
    }

    await visit.save();

    // Move to history
    await this.moveToHistory(visit);

    // Publish event
    await publishEvent('visit.status.changed', {
      visitId: visit.id,
      hospitalId,
      doctorId,
      status: 'COMPLETED',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Delay a patient (move to end of queue)
   */
  static async delayPatient(
    hospitalId: string,
    doctorId: string,
    visitId: string
  ): Promise<void> {
    const visit = await Visit.findOne({
      where: {
        id: visitId,
        hospitalId,
        doctorId,
      },
    });

    if (!visit) {
      throw new Error('Visit not found');
    }

    // Update checked-in time to now (moves to end of queue)
    visit.checkedInAt = new Date();
    await visit.save();

    // Publish event
    await publishEvent('visit.delayed', {
      visitId: visit.id,
      hospitalId,
      doctorId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Reassign visit to another doctor
   */
  static async reassignVisit(
    hospitalId: string,
    visitId: string,
    newDoctorId: string
  ): Promise<Visit> {
    const visit = await Visit.findOne({
      where: {
        id: visitId,
        hospitalId,
      },
      include: [
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
      ],
    });

    if (!visit) {
      throw new Error('Visit not found');
    }

    const newDoctor = await Doctor.findByPk(newDoctorId);
    if (!newDoctor || newDoctor.hospitalId !== hospitalId) {
      throw new Error('New doctor not found');
    }

    const oldDoctorId = visit.doctorId;
    visit.doctorId = newDoctorId;
    visit.departmentId = newDoctor.departmentId;

    // Get new token number for the new doctor
    const config = await HospitalConfig.findOne({
      where: { hospitalId },
    });
    const deptCfg = await ConfigResolverService.getEffectiveDepartmentConfig(hospitalId, visit.departmentId);
    const tokenResetFrequency = deptCfg.tokenResetFrequency || config?.tokenResetFrequency || 'DAILY';
    visit.tokenNumber = await getNextTokenNumber(
      hospitalId,
      newDoctorId,
      tokenResetFrequency
    );

    await visit.save();

    // Publish event
    await publishEvent('visit.reassigned', {
      visitId: visit.id,
      hospitalId,
      oldDoctorId,
      newDoctorId,
      timestamp: new Date().toISOString(),
    });

    return visit;
  }

  /**
   * Move completed visit to history
   */
  private static async moveToHistory(visit: Visit): Promise<void> {
    const waitTime = visit.startedAt
      ? differenceInMinutes(visit.startedAt, visit.checkedInAt)
      : null;
    
    const consultationDuration =
      visit.startedAt && visit.completedAt
        ? differenceInMinutes(visit.completedAt, visit.startedAt)
        : null;

    await VisitHistory.create({
      visitId: visit.id,
      hospitalId: visit.hospitalId,
      patientId: visit.patientId,
      doctorId: visit.doctorId,
      departmentId: visit.departmentId,
      tokenNumber: visit.tokenNumber,
      status: visit.status,
      priority: visit.priority,
      checkedInAt: visit.checkedInAt,
      startedAt: visit.startedAt,
      completedAt: visit.completedAt,
      actualWaitTime: waitTime,
      actualConsultationDuration: consultationDuration,
    });
  }

  /**
   * Mark carryover patients from previous day
   */
  static async markCarryoverPatients(hospitalId: string): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const unservedVisits = await Visit.findAll({
      where: {
        hospitalId,
        status: {
          [Op.in]: ['WAITING', 'CHECKED_IN', 'ON_HOLD'],
        },
        checkedInAt: {
          [Op.lt]: today,
        },
        isCarryover: false,
      },
    });

    for (const visit of unservedVisits) {
      visit.status = 'CARRYOVER';
      visit.isCarryover = true;
      await visit.save();
    }

    logger.info(`Marked ${unservedVisits.length} patients as carryover for hospital ${hospitalId}`);
  }
}

