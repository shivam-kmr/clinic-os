import { Op } from 'sequelize';
import '../models'; // Import to initialize associations
import Hospital from '../models/Hospital';
import HospitalConfig from '../models/HospitalConfig';
import Department from '../models/Department';
import Doctor from '../models/Doctor';
import User from '../models/User';
import { publishEvent } from '../config/rabbitmq';
import { logger } from '../config/logger';
import sequelize from '../config/database';
import bcrypt from 'bcryptjs';

export interface CreateHospitalData {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  subdomain?: string; // e.g., "regencyhospital" for regencyhospital.clinicos.com
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
  /**
   * Create hospital and assign to user
   */
  static async createHospital(
    userId: string,
    data: CreateHospitalData
  ): Promise<Hospital> {
    const transaction = await sequelize.transaction();

    try {
      // Validate subdomain if provided
      if (data.subdomain) {
        // Slugify subdomain: lowercase, replace spaces with hyphens, remove special chars
        const slugified = data.subdomain
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');

        if (slugified.length < 3 || slugified.length > 63) {
          throw new Error('Subdomain must be between 3 and 63 characters');
        }

        // Check if subdomain is already taken
        const existing = await Hospital.findOne({
          where: { subdomain: slugified },
          transaction,
        });

        if (existing) {
          throw new Error('Subdomain is already taken');
        }

        data.subdomain = slugified;
      }

      // Create hospital
      const hospital = await Hospital.create(
        {
          name: data.name,
          address: data.address,
          phone: data.phone,
          email: data.email,
          subdomain: data.subdomain,
          customDomainVerified: false,
          status: 'ACTIVE',
        },
        { transaction }
      );

      // Update user's hospitalId and role to HOSPITAL_OWNER if not already
      const user = await User.findByPk(userId, { transaction });
      if (user) {
        await user.update(
          {
            hospitalId: hospital.id,
            // If user is not SUPERADMIN, set role to HOSPITAL_OWNER
            role: user.role === 'SUPERADMIN' ? 'SUPERADMIN' : 'HOSPITAL_OWNER',
          },
          { transaction }
        );
      }

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
                hospitalId: hospital.id,
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
            // User exists - update their hospitalId and role
            await managerUser.update(
              {
                hospitalId: hospital.id,
                role: 'HOSPITAL_MANAGER',
              },
              { transaction }
            );
          }
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
            role: 'DOCTOR',
            hospitalId,
          },
          { transaction }
        );
      } else {
        // Update existing user
        await user.update(
          {
            hospitalId,
            role: 'DOCTOR',
            firstName: data.firstName,
            lastName: data.lastName,
          },
          { transaction }
        );
      }

      // Check if doctor already exists
      let doctor = await Doctor.findOne({
        where: { userId: user.id },
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
            role: 'RECEPTIONIST',
            hospitalId,
          },
          { transaction }
        );
      } else {
        // Update existing user
        await user.update(
          {
            hospitalId,
            role: 'RECEPTIONIST',
            firstName: data.firstName,
            lastName: data.lastName,
          },
          { transaction }
        );
      }

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

    // Get receptionists
    const receptionists = await User.findAll({
      where: {
        hospitalId,
        role: 'RECEPTIONIST',
      },
      attributes: ['id', 'email', 'firstName', 'lastName', 'createdAt'],
      order: [['createdAt', 'ASC']],
    });

    return {
      hospital,
      config: config || null,
      departments,
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
