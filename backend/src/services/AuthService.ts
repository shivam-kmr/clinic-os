import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Doctor from '../models/Doctor';
import { logger } from '../config/logger';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'HOSPITAL_OWNER' | 'RECEPTIONIST' | 'DOCTOR';
  hospitalId?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    hospitalId: string | null;
    doctorId?: string;
  };
}

/**
 * Service for authentication operations
 */
export class AuthService {
  /**
   * Login with email and password
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { email, password } = credentials;

    // Find user by email
    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Get doctor ID if user is a doctor
    let doctorId: string | undefined;
    if (user.role === 'DOCTOR') {
      const doctor = await Doctor.findOne({
        where: { userId: user.id },
      });
      if (doctor) {
        doctorId = doctor.id;
      }
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const token = jwt.sign(
      {
        userId: user.id,
        hospitalId: user.hospitalId,
        role: user.role,
      },
      jwtSecret,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      }
    );

    logger.info(`User ${user.email} logged in`);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        hospitalId: user.hospitalId,
        doctorId,
      },
    };
  }

  /**
   * Register a new user
   */
  static async register(data: RegisterData): Promise<AuthResponse> {
    const { email, password, firstName, lastName, role, hospitalId } = data;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Validate hospitalId for non-superadmin users
    if (role !== 'SUPERADMIN' && !hospitalId) {
      throw new Error('hospitalId is required for this role');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      email,
      passwordHash,
      firstName,
      lastName,
      role,
      hospitalId: hospitalId || null,
    });

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const token = jwt.sign(
      {
        userId: user.id,
        hospitalId: user.hospitalId,
        role: user.role,
      },
      jwtSecret,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      }
    );

    logger.info(`New user registered: ${user.email}`);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        hospitalId: user.hospitalId,
      },
    };
  }

  /**
   * Get current user info
   */
  static async getCurrentUser(userId: string): Promise<AuthResponse['user']> {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Get doctor ID if user is a doctor
    let doctorId: string | undefined;
    if (user.role === 'DOCTOR') {
      const doctor = await Doctor.findOne({
        where: { userId: user.id },
      });
      if (doctor) {
        doctorId = doctor.id;
      }
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      hospitalId: user.hospitalId,
      doctorId,
    };
  }
}

