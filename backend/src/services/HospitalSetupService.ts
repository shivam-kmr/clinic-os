import { Op } from 'sequelize';
import '../models'; // Import to initialize associations
import Hospital from '../models/Hospital';
import HospitalConfig from '../models/HospitalConfig';
import Department from '../models/Department';
import Doctor from '../models/Doctor';
import User from '../models/User';
import HospitalUser from '../models/HospitalUser';
import DepartmentConfig from '../models/DepartmentConfig';
import { publishEvent } from '../config/rabbitmq';
import { logger } from '../config/logger';
import sequelize from '../config/database';
import bcrypt from 'bcryptjs';

export interface CreateHospitalData {
  name: string;
  street?: string;
  buildingNumber?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  managerEmails?: string[]; // Emails of additional hospital managers/owners
}

export interface CreateHospitalConfigData {
  bookingMode?: 'TOKEN_ONLY' | 'TIME_SLOT_ONLY' | 'BOTH';
  defaultConsultationDuration?: number;
  bufferTimeBetweenAppointments?: number;
  arrivalWindowBeforeAppointment?: number;
  businessHours?: HospitalConfig['businessHours'];
  tokenResetFrequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'NEVER';
  autoReassignOnLeave?: boolean;
  maxQueueLength?: number;
}

export interface CreateDepartmentData {
  name: string;
  description?: string;
}

export interface CreateDoctorData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  departmentId: string;
  employeeId?: string;
  specialization?: string;
  consultationDuration?: number;
  dailyPatientLimit?: number;
}

export interface CreateReceptionistData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  departmentId?: string; // Optional - receptionist can be hospital-wide or department-specific
}

export class HospitalSetupService {
  private static slugFromHospitalName(name: string): string {
    // Requirement: "all small, without spaces" -> keep alphanumerics only.
    // Example: "Regency Hospital" -> "regencyhospital"
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  private static randomSuffix(len = 4): string {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let out = '';
    for (let i = 0; i < len; i += 1) {
      out += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return out;
  }

  static async suggestSubdomainFromName(name: string): Promise<{
    base: string;
    available: boolean;
    suggestedSubdomain: string;
  }> {
    const base = this.slugFromHospitalName(name);

    // Return early for invalid/too-short names; caller can prompt the user.
    if (base.length < 3) {
      return { base, available: false, suggestedSubdomain: base };
    }

    const existing = await Hospital.findOne({ where: { subdomain: base } });
    if (!existing) {
      return { base, available: true, suggestedSubdomain: base };
    }

    // If taken: base-xxxx (xxxx = 4 alphanumeric).
    // Ensure uniqueness even if collision happens.
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const candidate = `${base}-${this.randomSuffix(4)}`;
      const collision = await Hospital.findOne({ where: { subdomain: candidate } });
      if (!collision) {
        return { base, available: false, suggestedSubdomain: candidate };
      }
    }

    // Extremely unlikely; still return something stable.
    const fallback = `${base}-${Date.now().toString(36).slice(-4)}`;
    return { base, available: false, suggestedSubdomain: fallback };
  }

  /**
   * Create hospital and assign to user
   */
  static async createHospital(
    userId: string,
    data: CreateHospitalData
  ): Promise<Hospital> {
    const transaction = await sequelize.transaction();

    try {
      // Always derive subdomain from hospital name (server is the source of truth).
      // If base is taken, suffix with "-xxxx" (4 chars).
      const subdomainInfo = await this.suggestSubdomainFromName(data.name);
      const subdomain = subdomainInfo.suggestedSubdomain;

      if (subdomain.length < 3 || subdomain.length > 63) {
        throw new Error('Derived subdomain must be between 3 and 63 characters');
      }

      const addressParts = [
        data.buildingNumber,
        data.street,
        data.city,
        data.state,
        data.postalCode,
        data.country,
      ].filter(Boolean);
      const address = addressParts.length ? addressParts.join(', ') : undefined;

      // Create hospital
      const hospital = await Hospital.create(
        {
          name: data.name,
          // Keep legacy address for backwards compatibility (public APIs, etc.)
          address,
          street: data.street,
          buildingNumber: data.buildingNumber,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          country: data.country,
          phone: data.phone,
          email: data.email,
          subdomain,
          customDomainVerified: false,
          status: 'ACTIVE',
        },
        { transaction }
      );

      // Create membership for creator as HOSPITAL_OWNER (per-clinic role)
      await HospitalUser.create(
        {
          userId,
          hospitalId: hospital.id,
          role: 'HOSPITAL_OWNER',
          doctorId: null,
        },
        { transaction }
      );

      // Create accounts for additional managers if provided
      if (data.managerEmails && data.managerEmails.length > 0) {
        for (const email of data.managerEmails) {
          // Check if user already exists
          let managerUser = await User.findOne({
            where: { email },
            transaction,
          });

          if (!managerUser) {
            // Create new user account for manager
            const tempPassword = Math.random().toString(36).slice(-12); // Generate temp password
            const passwordHash = await bcrypt.hash(tempPassword, 10);
            managerUser = await User.create(
              {
                email,
                passwordHash,
                firstName: 'Hospital', // Default, should be updated
                lastName: 'Manager',
                role: 'HOSPITAL_MANAGER',
                hospitalId: null, // legacy field; multi-clinic is handled via memberships
              },
              { transaction }
            );

            // Publish event for sending invitation email
            await publishEvent('hospital.manager.created', {
              userId: managerUser.id,
              hospitalId: hospital.id,
              email,
              tempPassword,
            });
          } else {
            // User exists - do NOT override their global role/hospital; just grant a membership
          }

          // Ensure membership exists for manager
          await HospitalUser.findOrCreate({
            where: { userId: managerUser.id, hospitalId: hospital.id },
            defaults: {
              userId: managerUser.id,
              hospitalId: hospital.id,
              role: 'HOSPITAL_MANAGER',
              doctorId: null,
            },
            transaction,
          });
        }
      }

      // Create default config
      await HospitalConfig.create(
        {
          hospitalId: hospital.id,
          bookingMode: 'TOKEN_ONLY',
          defaultConsultationDuration: 15,
          bufferTimeBetweenAppointments: 5,
          arrivalWindowBeforeAppointment: 15,
          businessHours: {
            monday: { start: '10:00', end: '18:00', isOpen: true },
            tuesday: { start: '10:00', end: '18:00', isOpen: true },
            wednesday: { start: '10:00', end: '18:00', isOpen: true },
            thursday: { start: '10:00', end: '18:00', isOpen: true },
            friday: { start: '10:00', end: '18:00', isOpen: true },
            saturday: { start: '10:00', end: '18:00', isOpen: true },
            sunday: { start: '10:00', end: '18:00', isOpen: false },
          },
          tokenResetFrequency: 'DAILY',
          autoReassignOnLeave: false,
        },
        { transaction }
      );

      await transaction.commit();
      logger.info(`Hospital created: ${hospital.id} by user ${userId}`);

      return hospital;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update hospital config
   */
  static async updateHospitalConfig(
    hospitalId: string,
    data: CreateHospitalConfigData
  ): Promise<HospitalConfig> {
    const [config] = await HospitalConfig.findOrCreate({
      where: { hospitalId },
      defaults: {
        hospitalId,
        bookingMode: data.bookingMode || 'TOKEN_ONLY',
        defaultConsultationDuration: data.defaultConsultationDuration || 15,
        bufferTimeBetweenAppointments: data.bufferTimeBetweenAppointments || 5,
        arrivalWindowBeforeAppointment: data.arrivalWindowBeforeAppointment || 15,
        businessHours: data.businessHours || {
          monday: { start: '10:00', end: '18:00', isOpen: true },
          tuesday: { start: '10:00', end: '18:00', isOpen: true },
          wednesday: { start: '10:00', end: '18:00', isOpen: true },
          thursday: { start: '10:00', end: '18:00', isOpen: true },
          friday: { start: '10:00', end: '18:00', isOpen: true },
          saturday: { start: '10:00', end: '18:00', isOpen: true },
          sunday: { start: '10:00', end: '18:00', isOpen: false },
        },
        tokenResetFrequency: data.tokenResetFrequency || 'DAILY',
        autoReassignOnLeave: data.autoReassignOnLeave || false,
        maxQueueLength: data.maxQueueLength,
      },
    });

    if (!config.isNewRecord) {
      await config.update(data);
    }

    return config;
  }

  /**
   * Create department
   */
  static async createDepartment(
    hospitalId: string,
    data: CreateDepartmentData
  ): Promise<Department> {
    const department = await Department.create({
      hospitalId,
      name: data.name,
      description: data.description,
    });

    // Create an empty department config row so setup can track configuration completion.
    await DepartmentConfig.findOrCreate({
      where: { hospitalId, departmentId: department.id },
      defaults: { hospitalId, departmentId: department.id, bookingMode: null },
    });

    logger.info(`Department created: ${department.id} in hospital ${hospitalId}`);
    return department;
  }

  /**
   * Create doctor and user account
   */
  static async createDoctor(
    hospitalId: string,
    data: CreateDoctorData
  ): Promise<{ doctor: Doctor; user: User }> {
    const transaction = await sequelize.transaction();

    try {
      // Check if user already exists
      let user = await User.findOne({
        where: { email: data.email },
        transaction,
      });

      if (!user) {
        // Create user account
        const passwordHash = await bcrypt.hash(data.password, 10);
        user = await User.create(
          {
            email: data.email,
            passwordHash,
            firstName: data.firstName,
            lastName: data.lastName,
            role: 'DOCTOR', // legacy/global role (per-clinic role is handled via memberships)
            hospitalId: null,
          },
          { transaction }
        );
      } else {
        // Do not override existing user's global role/hospital. Update names only.
        await user.update(
          {
            firstName: data.firstName,
            lastName: data.lastName,
          },
          { transaction }
        );
      }

      // Check if doctor already exists
      let doctor = await Doctor.findOne({
        where: { userId: user.id, hospitalId },
        transaction,
      });

      if (doctor) {
        // Update existing doctor
        await doctor.update(
          {
            hospitalId,
            departmentId: data.departmentId,
            employeeId: data.employeeId,
            specialization: data.specialization,
            consultationDuration: data.consultationDuration,
            dailyPatientLimit: data.dailyPatientLimit,
          },
          { transaction }
        );
      } else {
        // Create doctor
        doctor = await Doctor.create(
          {
            hospitalId,
            userId: user.id,
            departmentId: data.departmentId,
            employeeId: data.employeeId,
            specialization: data.specialization,
            status: 'ACTIVE',
            consultationDuration: data.consultationDuration,
            dailyPatientLimit: data.dailyPatientLimit,
          },
          { transaction }
        );
      }

      // Ensure membership exists for this doctor in this hospital
      await HospitalUser.findOrCreate({
        where: { userId: user.id, hospitalId },
        defaults: {
          userId: user.id,
          hospitalId,
          role: 'DOCTOR',
          doctorId: doctor.id,
        },
        transaction,
      });

      // If membership existed but doctorId is missing/outdated, update it
      await HospitalUser.update(
        { doctorId: doctor.id, role: 'DOCTOR' },
        { where: { userId: user.id, hospitalId }, transaction }
      );

      await transaction.commit();

      // Publish event for email invitation
      await publishEvent('doctor.created', {
        doctorId: doctor.id,
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        hospitalId,
        departmentId: data.departmentId,
      });

      logger.info(`Doctor created: ${doctor.id} for user ${user.email}`);

      return { doctor, user };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Create receptionist user account
   */
  static async createReceptionist(
    hospitalId: string,
    data: CreateReceptionistData
  ): Promise<User> {
    const transaction = await sequelize.transaction();

    try {
      // Check if user already exists
      let user = await User.findOne({
        where: { email: data.email },
        transaction,
      });

      if (!user) {
        // Create user account
        const passwordHash = await bcrypt.hash(data.password, 10);
        user = await User.create(
          {
            email: data.email,
            passwordHash,
            firstName: data.firstName,
            lastName: data.lastName,
            role: 'RECEPTIONIST', // legacy/global role
            hospitalId: null,
          },
          { transaction }
        );
      } else {
        // Do not override existing user's global role/hospital. Update names only.
        await user.update(
          {
            firstName: data.firstName,
            lastName: data.lastName,
          },
          { transaction }
        );
      }

      // Ensure membership exists for receptionist in this hospital
      await HospitalUser.findOrCreate({
        where: { userId: user.id, hospitalId },
        defaults: {
          userId: user.id,
          hospitalId,
          role: 'RECEPTIONIST',
          doctorId: null,
          departmentId: data.departmentId || null,
        },
        transaction,
      });

      await HospitalUser.update(
        { role: 'RECEPTIONIST', departmentId: data.departmentId || null },
        { where: { userId: user.id, hospitalId }, transaction }
      );

      await transaction.commit();

      // Publish event for email invitation
      await publishEvent('receptionist.created', {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        hospitalId,
        departmentId: data.departmentId,
      });

      logger.info(`Receptionist created: ${user.id} for user ${user.email}`);

      return user;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get hospital setup data
   */
  static async getHospitalSetup(hospitalId: string) {
    const hospital = await Hospital.findByPk(hospitalId);
    if (!hospital) {
      throw new Error('Hospital not found');
    }

    const config = await HospitalConfig.findOne({
      where: { hospitalId },
    });

    const departments = await Department.findAll({
      where: { hospitalId },
      order: [['name', 'ASC']],
    });

    const departmentConfigs = await DepartmentConfig.findAll({
      where: { hospitalId },
      order: [['createdAt', 'ASC']],
    });

    const doctors = await Doctor.findAll({
      where: { hospitalId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName'],
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name'],
        },
      ],
      order: [['createdAt', 'ASC']],
    });

    // Get receptionists via memberships (multi-clinic)
    const receptionistMemberships = await HospitalUser.findAll({
      where: {
        hospitalId,
        role: 'RECEPTIONIST',
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName', 'createdAt'],
          required: true,
        },
      ],
      order: [['createdAt', 'ASC']],
    });

    const receptionists = receptionistMemberships.map((m: any) => m.user);

    return {
      hospital,
      config: config || null,
      departments,
      departmentConfigs,
      doctors,
      receptionists,
    };
  }

  /**
   * Update hospital (for custom domain setup)
   */
  static async updateHospital(
    hospitalId: string,
    data: { customDomain?: string }
  ): Promise<Hospital> {
    const hospital = await Hospital.findByPk(hospitalId);
    if (!hospital) {
      throw new Error('Hospital not found');
    }

    if (data.customDomain) {
      // Validate domain format
      const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;
      if (!domainRegex.test(data.customDomain)) {
        throw new Error('Invalid domain format');
      }

      // Check if domain is already taken
      const existing = await Hospital.findOne({
        where: {
          customDomain: data.customDomain,
          id: { [Op.ne]: hospitalId },
        },
      });

      if (existing) {
        throw new Error('Custom domain is already taken');
      }

      // Reset verification status when domain changes
      await hospital.update({
        customDomain: data.customDomain,
        customDomainVerified: false,
      });
    }

    return hospital;
  }
}
