import { Op } from 'sequelize';
import Doctor from '../models/Doctor';
import Department from '../models/Department';
import Visit from '../models/Visit';
import { logger } from '../config/logger';

export interface DoctorAssignmentResult {
  doctorId: string;
  available: boolean;
  currentQueueLength: number;
  estimatedWaitTime: number;
}

/**
 * Service for assigning doctors to department-level appointments/visits
 */
export class DoctorAssignmentService {
  /**
   * Find the best available doctor for a department-level visit
   */
  static async assignDoctorForDepartmentVisit(
    hospitalId: string,
    departmentId: string,
    _checkInTime: Date = new Date()
  ): Promise<string> {
    // Get all active doctors in the department
    const doctors = await Doctor.findAll({
      where: {
        hospitalId,
        departmentId,
        status: 'ACTIVE',
      },
      include: [
        {
          model: Department,
          as: 'department',
        },
      ],
    });

    if (doctors.length === 0) {
      throw new Error('No active doctors available in this department');
    }

    // Evaluate each doctor
    const doctorEvaluations: DoctorAssignmentResult[] = await Promise.all(
      doctors.map(async (doctor) => {
        const queueLength = await this.getCurrentQueueLength(doctor.id);
        const estimatedWaitTime = await this.calculateEstimatedWaitTime(
          doctor.id,
          doctor.consultationDuration || 15
        );

        return {
          doctorId: doctor.id,
          available: true, // TODO: Check if doctor is at capacity
          currentQueueLength: queueLength,
          estimatedWaitTime,
        };
      })
    );

    // Sort by queue length (least busy first)
    doctorEvaluations.sort((a, b) => {
      if (a.currentQueueLength !== b.currentQueueLength) {
        return a.currentQueueLength - b.currentQueueLength;
      }
      return a.estimatedWaitTime - b.estimatedWaitTime;
    });

    const selectedDoctor = doctorEvaluations[0];
    
    if (!selectedDoctor) {
      throw new Error('No available doctor found');
    }

    logger.info(`Assigned doctor ${selectedDoctor.doctorId} for department ${departmentId}`);
    return selectedDoctor.doctorId;
  }

  /**
   * Get current queue length for a doctor
   */
  static async getCurrentQueueLength(doctorId: string): Promise<number> {
    return Visit.count({
      where: {
        doctorId,
        status: {
          [Op.in]: ['WAITING', 'CHECKED_IN', 'ON_HOLD'],
        },
      },
    });
  }

  /**
   * Calculate estimated wait time for a doctor's queue
   */
  static async calculateEstimatedWaitTime(
    doctorId: string,
    consultationDuration: number
  ): Promise<number> {
    const queueLength = await this.getCurrentQueueLength(doctorId);
    return queueLength * consultationDuration;
  }

  /**
   * Check if doctor has reached daily patient limit
   */
  static async isDoctorAtCapacity(doctorId: string): Promise<boolean> {
    const doctor = await Doctor.findByPk(doctorId);
    
    if (!doctor || !doctor.dailyPatientLimit) {
      return false; // No limit set
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCount = await Visit.count({
      where: {
        doctorId,
        status: {
          [Op.in]: ['COMPLETED', 'IN_PROGRESS', 'CHECKED_IN', 'WAITING'],
        },
        createdAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
      },
    });

    return todayCount >= doctor.dailyPatientLimit;
  }

  /**
   * Get available doctors in a department
   */
  static async getAvailableDoctors(
    hospitalId: string,
    departmentId: string
  ): Promise<Doctor[]> {
    return Doctor.findAll({
      where: {
        hospitalId,
        departmentId,
        status: 'ACTIVE',
      },
    });
  }
}

