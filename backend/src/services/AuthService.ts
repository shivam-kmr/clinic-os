import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import '../models'; // ensure associations are initialized for includes
import User from '../models/User';
import { logger } from '../config/logger';
import HospitalUser from '../models/HospitalUser';
import Hospital from '../models/Hospital';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'SUPERADMIN' | 'HOSPITAL_OWNER' | 'HOSPITAL_MANAGER' | 'RECEPTIONIST' | 'DOCTOR';
  hospitalId?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string; // base role on user record (SUPERADMIN is meaningful; others are legacy)
    memberships: Array<{
      hospitalId: string;
      hospitalName: string;
      role: string;
      doctorId?: string | null;
    }>;
  };
}

/**
 * Service for authentication operations
 */
export class AuthService {
  static async getMemberships(userId: string) {
    const memberships = await HospitalUser.findAll({
      where: { userId },
      include: [
        {
          model: Hospital,
          as: 'hospital',
          attributes: ['id', 'name'],
          required: true,
        },
      ],
      order: [['createdAt', 'ASC']],
    });

    return memberships.map((m: any) => ({
      hospitalId: m.hospitalId,
      hospitalName: m.hospital?.name || 'Hospital',
      role: m.role,
      doctorId: m.doctorId || null,
    }));
  }

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

    const memberships = await AuthService.getMemberships(user.id);

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as any;
    const token = jwt.sign(
      {
        userId: user.id,
        baseRole: user.role,
      },
      jwtSecret,
      {
        expiresIn,
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
        memberships,
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

    // Legacy: keep hospitalId requirement for the old register API
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

    // Backfill a membership row for this legacy registration path
    if (hospitalId && role !== 'SUPERADMIN') {
      await HospitalUser.create({
        userId: user.id,
        hospitalId,
        role,
        doctorId: null,
      });
    }

    const memberships = await AuthService.getMemberships(user.id);

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as any;
    const token = jwt.sign(
      {
        userId: user.id,
        baseRole: user.role,
      },
      jwtSecret,
      {
        expiresIn,
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
        memberships,
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

    const memberships = await AuthService.getMemberships(user.id);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      memberships,
    };
  }
}

