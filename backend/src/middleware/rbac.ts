import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import User from '../models/User';

type Role = 'SUPERADMIN' | 'HOSPITAL_OWNER' | 'RECEPTIONIST' | 'DOCTOR';

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    // HOSPITAL_MANAGER has same permissions as HOSPITAL_OWNER
    const userRole = req.user.role;
    const normalizedRole = userRole === 'HOSPITAL_MANAGER' ? 'HOSPITAL_OWNER' : userRole;
    const normalizedAllowedRoles = allowedRoles.map(role => 
      role === 'HOSPITAL_OWNER' ? [role, 'HOSPITAL_MANAGER'] : [role]
    ).flat();

    if (normalizedAllowedRoles.includes(normalizedRole) || normalizedAllowedRoles.includes(userRole)) {
      next();
      return;
    }

    res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
      },
    });
  };
};

export const requireHospitalContext = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
    return;
  }

  // Superadmin can access any hospital via query param
  if (req.user.role === 'SUPERADMIN') {
    const hospitalId = req.query.hospitalId as string | undefined;
    if (hospitalId) {
      req.user.hospitalId = hospitalId;
    }
    next();
    return;
  }

  // If user's hospitalId is null, try to get it from the database
  if (!req.user.hospitalId) {
    try {
      const user = await User.findByPk(req.user.id);
      if (user && user.hospitalId) {
        req.user.hospitalId = user.hospitalId;
      }
    } catch (error) {
      // If database lookup fails, continue with null hospitalId
    }
  }

  // For routes with hospitalId in params (e.g., /sse/reception/:hospitalId)
  // If user's hospitalId is still null, allow using route param as fallback
  // The controller will verify the user has access to this hospital
  if (!req.user.hospitalId && req.params.hospitalId) {
    // Set hospitalId from route param for context
    // The controller must verify the user has access to this hospital
    req.user.hospitalId = req.params.hospitalId;
  }

  // Other roles must have a hospitalId (either from user record or route param)
  if (!req.user.hospitalId) {
    res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Hospital context required',
      },
    });
    return;
  }

  next();
};

