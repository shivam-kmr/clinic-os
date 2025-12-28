import sequelize from '../config/database';
import Patient from '../models/Patient';
import Appointment from '../models/Appointment';
import { AppointmentService } from './AppointmentService';
import { ConfigResolverService } from './ConfigResolverService';

export type ReceptionIntakeInput = {
  hospitalId: string;
  patientId?: string | null;
  patient: {
    phone: string;
    firstName: string;
    lastName: string;
    age?: number;
    gender: 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';
  };
  departmentId: string;
  issueDescription?: string;
  scheduledAt?: Date | null;
};

export class ReceptionIntakeService {
  static approximateDobFromAge(age?: number): Date | null {
    if (!age || age < 0 || age > 130) return null;
    const now = new Date();
    const year = now.getFullYear() - age;
    // Approximation: Jan 1 of the calculated year (keeps things simple for now)
    return new Date(Date.UTC(year, 0, 1));
  }

  static async intakeWalkIn(input: ReceptionIntakeInput): Promise<{
    patient: Patient;
    appointment: Appointment;
    visit: any;
  }> {
    const transaction = await sequelize.transaction();
    try {
      const { hospitalId, departmentId } = input;

      const phone = input.patient.phone.trim();
      if (!phone) throw new Error('phone is required');

      // Patient selection rules:
      // - If patientId is provided, it MUST exist (scoped to hospital) and we update that record.
      // - If patientId is not provided:
      //    - 0 matches by phone -> create
      //    - 1 match by phone  -> update that record
      //    - >1 matches by phone -> require explicit selection to avoid overwriting wrong profile
      let patient: Patient | null = null;

      if (input.patientId) {
        patient = await Patient.findOne({
          where: { id: input.patientId, hospitalId },
          transaction,
        });
        if (!patient) throw new Error('PATIENT_NOT_FOUND');
      } else {
        const matches = await Patient.findAll({
          where: { hospitalId, phone },
          transaction,
          order: [['updatedAt', 'DESC']],
          limit: 2,
        });
        if (matches.length > 1) {
          throw new Error('MULTIPLE_PATIENTS_FOUND');
        }
        patient = matches[0] || null;
      }

      const dob = this.approximateDobFromAge(input.patient.age);

      if (!patient) {
        patient = await Patient.create(
          {
            hospitalId,
            phone,
            firstName: input.patient.firstName.trim(),
            lastName: input.patient.lastName.trim(),
            gender: input.patient.gender || 'UNKNOWN',
            dateOfBirth: dob || undefined,
          },
          { transaction }
        );
      } else {
        await patient.update(
          {
            firstName: input.patient.firstName.trim(),
            lastName: input.patient.lastName.trim(),
            gender: input.patient.gender || patient.gender,
            dateOfBirth: dob || patient.dateOfBirth,
          },
          { transaction }
        );
      }

      const effective = await ConfigResolverService.getEffectiveDepartmentConfig(hospitalId, departmentId);

      // Determine scheduledAt:
      // - TIME_SLOT_ONLY: requires explicit scheduledAt
      // - TOKEN_ONLY: uses now (+1 min)
      // - BOTH: allow optional scheduledAt, default now (+1 min)
      const now = new Date();
      const defaultScheduledAt = new Date(now.getTime() + 60_000); // avoid "past" validation in AppointmentService
      const scheduledAt =
        input.scheduledAt && !isNaN(input.scheduledAt.getTime()) ? input.scheduledAt : defaultScheduledAt;

      if (effective.bookingMode === 'TIME_SLOT_ONLY' && !input.scheduledAt) {
        throw new Error('scheduledAt is required for time-slot departments');
      }

      const appointment = await Appointment.create(
        {
          hospitalId,
          patientId: patient.id,
          departmentId,
          doctorId: null,
          scheduledAt,
          bookingType: 'WALK_IN',
          status: 'PENDING',
          notes: input.issueDescription || null,
        } as any,
        { transaction }
      );

      // Commit appointment + patient first so AppointmentService can read it (it uses its own queries)
      await transaction.commit();

      const visit = await AppointmentService.checkInAppointment(hospitalId, appointment.id);

      return { patient, appointment, visit };
    } catch (error) {
      await transaction.rollback().catch(() => {});
      throw error;
    }
  }
}



