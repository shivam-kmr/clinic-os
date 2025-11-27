import { OAuth2Client } from 'google-auth-library';
import jwt, { type SignOptions } from 'jsonwebtoken';
import User from '../models/User';
import Doctor from '../models/Doctor';
import { logger } from '../config/logger';
import { AuthResponse } from './AuthService';

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/auth/google/callback'
);

/**
 * Service for Google OAuth authentication
 */
export class GoogleAuthService {
  /**
   * Get Google OAuth URL
   */
  static getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    return client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });
  }

  /**
   * Verify Google ID token and get user info
   */
  static async verifyIdToken(idToken: string): Promise<{
    email: string;
    name: string;
    picture?: string;
    sub: string;
  }> {
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Invalid token payload');
      }

      return {
        email: payload.email!,
        name: payload.name || '',
        picture: payload.picture,
        sub: payload.sub,
      };
    } catch (error) {
      logger.error('Google token verification error:', error);
      throw new Error('Invalid Google token');
    }
  }

  /**
   * Handle Google OAuth callback
   */
  static async handleCallback(code: string): Promise<AuthResponse> {
    try {
      // Exchange code for tokens
      const { tokens } = await client.getToken(code);
      client.setCredentials(tokens);

      if (!tokens.id_token) {
        throw new Error('No ID token received from Google');
      }

      // Verify and get user info
      const googleUser = await this.verifyIdToken(tokens.id_token);

      // Find or create user
      let user = await User.findOne({
        where: { email: googleUser.email },
      });

      if (!user) {
        // Create new user (you may want to prompt for role/hospital)
        // For now, we'll create a basic user - in production, you'd want a registration flow
        const [firstName, ...lastNameParts] = googleUser.name.split(' ');
        const lastName = lastNameParts.join(' ') || 'User';

        user = await User.create({
          email: googleUser.email,
          passwordHash: '', // Google users don't need password
          firstName,
          lastName,
          role: 'RECEPTIONIST', // Default role - should be configurable
          hospitalId: null, // Should be set during registration flow
        });

        logger.info(`New Google user created: ${user.email}`);
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

      const expiresIn: string = process.env.JWT_EXPIRES_IN || '7d';
      const token = jwt.sign(
        {
          userId: user.id,
          hospitalId: user.hospitalId,
          role: user.role,
        },
        jwtSecret,
        {
          expiresIn,
        } as SignOptions
      );

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
    } catch (error) {
      logger.error('Google OAuth callback error:', error);
      throw error;
    }
  }

  /**
   * Login with Google ID token (for frontend direct token)
   */
  static async loginWithIdToken(idToken: string): Promise<AuthResponse> {
    try {
      // Verify token and get user info
      const googleUser = await this.verifyIdToken(idToken);

      // Find user
      const user = await User.findOne({
        where: { email: googleUser.email },
      });

      if (!user) {
        throw new Error('User not found. Please register first or use email/password login.');
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

      const expiresIn: string = process.env.JWT_EXPIRES_IN || '7d';
      const token = jwt.sign(
        {
          userId: user.id,
          hospitalId: user.hospitalId,
          role: user.role,
        },
        jwtSecret,
        {
          expiresIn,
        } as SignOptions
      );

      logger.info(`Google user logged in: ${user.email}`);

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
    } catch (error) {
      logger.error('Google login error:', error);
      throw error;
    }
  }

  /**
   * Login or register with Google user info (simplified flow)
   */
  static async loginOrRegisterWithGoogleInfo(
    email: string,
    name: string,
    _googleId?: string
  ): Promise<AuthResponse> {
    try {
      // Find or create user
      let user = await User.findOne({
        where: { email },
      });

      if (!user) {
        // Create new user
        const [firstName, ...lastNameParts] = name.split(' ');
        const lastName = lastNameParts.join(' ') || 'User';

        user = await User.create({
          email,
          passwordHash: '', // Google users don't need password
          firstName,
          lastName,
          role: 'RECEPTIONIST', // Default role - should be configurable
          hospitalId: null, // Should be set during registration flow
        });

        logger.info(`New Google user created: ${user.email}`);
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

      const expiresIn: string = process.env.JWT_EXPIRES_IN || '7d';
      const token = jwt.sign(
        {
          userId: user.id,
          hospitalId: user.hospitalId,
          role: user.role,
        },
        jwtSecret,
        {
          expiresIn,
        } as SignOptions
      );

      logger.info(`Google user logged in: ${user.email}`);

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
    } catch (error) {
      logger.error('Google login/register error:', error);
      throw error;
    }
  }
}

