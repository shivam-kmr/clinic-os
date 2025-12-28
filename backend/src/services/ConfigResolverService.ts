import HospitalConfig from '../models/HospitalConfig';
import DepartmentConfig from '../models/DepartmentConfig';

export type EffectiveConfig = {
  bookingMode: 'TOKEN_ONLY' | 'TIME_SLOT_ONLY' | 'BOTH';
  defaultConsultationDuration: number;
  bufferTimeBetweenAppointments: number;
  arrivalWindowBeforeAppointment: number;
  tokenResetFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'NEVER';
  maxQueueLength?: number;
  tokenPrefix?: string | null;
};

/**
 * Resolves config with the rule:
 * - DepartmentConfig overrides HospitalConfig
 * - HospitalConfig provides clinic-wide defaults
 */
export class ConfigResolverService {
  static async getHospitalConfig(hospitalId: string) {
    return HospitalConfig.findOne({ where: { hospitalId } });
  }

  static async getDepartmentConfig(hospitalId: string, departmentId: string) {
    return DepartmentConfig.findOne({ where: { hospitalId, departmentId } });
  }

  static async getEffectiveDepartmentConfig(
    hospitalId: string,
    departmentId: string
  ): Promise<EffectiveConfig> {
    const [hospitalConfig, departmentConfig] = await Promise.all([
      this.getHospitalConfig(hospitalId),
      this.getDepartmentConfig(hospitalId, departmentId),
    ]);

    const hc = hospitalConfig;
    const dc = departmentConfig;

    return {
      bookingMode: (dc?.bookingMode || hc?.bookingMode || 'TOKEN_ONLY') as EffectiveConfig['bookingMode'],
      defaultConsultationDuration:
        (dc?.defaultConsultationDuration ?? hc?.defaultConsultationDuration ?? 15),
      bufferTimeBetweenAppointments:
        (dc?.bufferTimeBetweenAppointments ?? hc?.bufferTimeBetweenAppointments ?? 5),
      arrivalWindowBeforeAppointment:
        (dc?.arrivalWindowBeforeAppointment ?? hc?.arrivalWindowBeforeAppointment ?? 15),
      tokenResetFrequency:
        (dc?.tokenResetFrequency ?? hc?.tokenResetFrequency ?? 'DAILY') as EffectiveConfig['tokenResetFrequency'],
      maxQueueLength: (dc?.maxQueueLength ?? hc?.maxQueueLength ?? undefined) || undefined,
      tokenPrefix: dc?.tokenPrefix ?? null,
    };
  }
}



