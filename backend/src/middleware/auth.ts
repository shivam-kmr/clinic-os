import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    hospitalId: string | null;
    role: string;
    email: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as {
      userId: string;
      hospitalId?: string; // legacy
      role?: string; // legacy
      baseRole?: string;
    };

    // Fetch user from database
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not found',
        },
      });
      return;
    }

    req.user = {
      id: user.id,
      // NOTE: hospitalId/role here are legacy fields; per-clinic context is applied later via requireHospitalContext
      hospitalId: user.hospitalId,
      role: user.role,
      email: user.email,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
        },
      });
      return;
    }

    res.status(500).json({
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication error',
      },
    });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const jwtSecret = process.env.JWT_SECRET;

      if (jwtSecret) {
        try {
          const decoded = jwt.verify(token, jwtSecret) as {
            userId: string;
            hospitalId?: string;
            role: string;
          };

          const user = await User.findByPk(decoded.userId);
          if (user) {
            req.user = {
              id: user.id,
              hospitalId: user.hospitalId,
              role: user.role,
              email: user.email,
            };
          }
        } catch (error) {
          // Ignore auth errors for optional auth
        }
      }
    }

    next();
  } catch (error) {
    next();
  }
};

