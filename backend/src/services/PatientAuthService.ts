import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import PatientUser from '../models/PatientUser';
import PatientHospital from '../models/PatientHospital';
import Patient from '../models/Patient';
import Hospital from '../models/Hospital';
import { logger } from '../config/logger';

export interface PatientLoginCredentials {
  email: string;
  password: string;
  hospitalId: string; // Required - patients sign in on their hospital's subdomain
}

export interface PatientRegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  hospitalId: string; // Automatically set from subdomain
}

export interface PatientAuthResponse {
  token: string;
  patient: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    hospitalId: string;
    patientId: string; // The Patient record ID for this hospital
  };
}

/**
 * Service for patient authentication operations
 */
export class PatientAuthService {
  /**
   * Login with email and password
   */
  static async login(credentials: PatientLoginCredentials): Promise<PatientAuthResponse> {
    const { email, password, hospitalId } = credentials;

    // Find patient user by email
    const patientUser = await PatientUser.findOne({
      where: { email },
    });

    if (!patientUser) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, patientUser.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Find the patient-hospital association
    const patientHospital = await PatientHospital.findOne({
      where: {
        patientUserId: patientUser.id,
        hospitalId,
      },
      include: [
        {
          model: Patient,
          as: 'patient',
        },
      ],
    });

    if (!patientHospital) {
      throw new Error('Patient account not found for this hospital');
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    const token = jwt.sign(
      {
        patientUserId: patientUser.id,
        hospitalId,
        patientId: patientHospital.patientId,
        role: 'PATIENT',
      },
      jwtSecret,
      {
        expiresIn,
      } as SignOptions
    );

    logger.info(`Patient ${patientUser.email} logged in for hospital ${hospitalId}`);

    return {
      token,
      patient: {
        id: patientUser.id,
        email: patientUser.email,
        firstName: patientUser.firstName,
        lastName: patientUser.lastName,
        phone: patientUser.phone,
        hospitalId,
        patientId: patientHospital.patientId,
      },
    };
  }

  /**
   * Register a new patient
   * Creates PatientUser and Patient records, and links them via PatientHospital
   */
  static async register(data: PatientRegisterData): Promise<PatientAuthResponse> {
    const { email, password, firstName, lastName, phone, hospitalId } = data;

    // Verify hospital exists and is active
    const hospital = await Hospital.findByPk(hospitalId);
    if (!hospital || hospital.status !== 'ACTIVE') {
      throw new Error('Hospital not found or inactive');
    }

    // Check if patient user already exists
    let patientUser = await PatientUser.findOne({
      where: { email },
    });

    if (!patientUser) {
      // Create new patient user
      const passwordHash = await bcrypt.hash(password, 10);
      patientUser = await PatientUser.create({
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
      });
    } else {
      // Patient user exists - check if they already have an account at this hospital
      const existingPatientHospital = await PatientHospital.findOne({
        where: {
          patientUserId: patientUser.id,
          hospitalId,
        },
      });

      if (existingPatientHospital) {
        throw new Error('You already have an account at this hospital');
      }
    }

    // Create or find Patient record for this hospital
    let patient = await Patient.findOne({
      where: {
        hospitalId,
        email: patientUser.email,
      },
    });

    if (!patient) {
      patient = await Patient.create({
        hospitalId,
        email: patientUser.email,
        firstName: patientUser.firstName,
        lastName: patientUser.lastName,
        phone: patientUser.phone,
        gender: 'UNKNOWN',
      });
    }

    // Create PatientHospital link
    await PatientHospital.create({
      patientUserId: patientUser.id,
      hospitalId,
      patientId: patient.id,
    });

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    const token = jwt.sign(
      {
        patientUserId: patientUser.id,
        hospitalId,
        patientId: patient.id,
        role: 'PATIENT',
      },
      jwtSecret,
      {
        expiresIn,
      } as SignOptions
    );

    logger.info(`New patient registered: ${patientUser.email} for hospital ${hospitalId}`);

    return {
      token,
      patient: {
        id: patientUser.id,
        email: patientUser.email,
        firstName: patientUser.firstName,
        lastName: patientUser.lastName,
        phone: patientUser.phone,
        hospitalId,
        patientId: patient.id,
      },
    };
  }

  /**
   * Get current patient info
   */
  static async getCurrentPatient(
    patientUserId: string,
    hospitalId: string
  ): Promise<PatientAuthResponse['patient']> {
    const patientUser = await PatientUser.findByPk(patientUserId);
    if (!patientUser) {
      throw new Error('Patient user not found');
    }

    const patientHospital = await PatientHospital.findOne({
      where: {
        patientUserId,
        hospitalId,
      },
      include: [
        {
          model: Patient,
          as: 'patient',
        },
      ],
    });

    if (!patientHospital) {
      throw new Error('Patient account not found for this hospital');
    }

    return {
      id: patientUser.id,
      email: patientUser.email,
      firstName: patientUser.firstName,
      lastName: patientUser.lastName,
      phone: patientUser.phone,
      hospitalId,
      patientId: patientHospital.patientId,
    };
  }
}

