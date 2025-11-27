import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Middleware to authenticate patient requests
 * Similar to staff auth but for patient users
 */
export const authenticatePatient = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
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
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'JWT secret not configured',
        },
      });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as {
      patientUserId: string;
      hospitalId: string;
      patientId: string;
      role: string;
    };

    // Verify it's a patient token
    if (decoded.role !== 'PATIENT') {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Invalid token type',
        },
      });
      return;
    }

    // Verify hospital context matches
    if (req.hospitalContext && decoded.hospitalId !== req.hospitalContext.id) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Hospital context mismatch',
        },
      });
      return;
    }

    // Attach patient user to request
    (req as any).patientUser = {
      id: decoded.patientUserId,
      hospitalId: decoded.hospitalId,
      patientId: decoded.patientId,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid token',
        },
      });
      return;
    }

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Authentication error',
      },
    });
  }
};

