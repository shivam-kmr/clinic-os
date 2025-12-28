import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import HospitalUser from '../models/HospitalUser';
import Doctor from '../models/Doctor';
import Department from '../models/Department';

type Role = 'SUPERADMIN' | 'HOSPITAL_OWNER' | 'HOSPITAL_MANAGER' | 'RECEPTIONIST' | 'DOCTOR';

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

  const authedUser = req.user;

  const getRequestedHospitalId = async (): Promise<string | null> => {
    const headerHospitalId =
      (req.headers['x-hospital-id'] as string | undefined) ||
      (req.headers['X-Hospital-Id' as any] as string | undefined);
    const queryHospitalId = req.query.hospitalId as string | undefined;

    // Explicit param hospitalId on routes (e.g. /sse/reception/:hospitalId)
    const paramHospitalId = (req.params as any).hospitalId as string | undefined;

    if (headerHospitalId) return headerHospitalId;
    if (paramHospitalId) return paramHospitalId;
    if (authedUser.role === 'SUPERADMIN' && queryHospitalId) return queryHospitalId;

    // If hospital isn't explicitly selected, try to derive it from route params
    // (e.g. /queue/doctor/:doctorId, /queue/department/:departmentId)
    const doctorId = (req.params as any).doctorId as string | undefined;
    const departmentId = (req.params as any).departmentId as string | undefined;

    if (doctorId) {
      const doctor = await Doctor.findByPk(doctorId);
      if (doctor?.hospitalId) return doctor.hospitalId;
    }

    if (departmentId) {
      const department = await Department.findByPk(departmentId);
      if (department?.hospitalId) return department.hospitalId;
    }

    // Legacy fallback: single-hospital field on users table
    if (authedUser.hospitalId) return authedUser.hospitalId;

    // If user is a member of exactly one hospital, default to it
    const memberships = await HospitalUser.findAll({
      where: { userId: authedUser.id },
      attributes: ['hospitalId'],
      limit: 2,
    });
    if (memberships.length === 1) return memberships[0].hospitalId;

    return null;
  };

  const requestedHospitalId = await getRequestedHospitalId();

  // Superadmin can access any hospital via query param/header/param
  if (req.user.role === 'SUPERADMIN') {
    if (requestedHospitalId) req.user.hospitalId = requestedHospitalId;
    next();
    return;
  }

  if (!requestedHospitalId) {
    res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Hospital context required (select a hospital)',
      },
    });
    return;
  }

  // Verify the user is a member of the requested hospital and apply per-clinic role
  const membership = await HospitalUser.findOne({
    where: { userId: authedUser.id, hospitalId: requestedHospitalId },
  });

  if (!membership) {
    res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied - you are not a member of this hospital',
      },
    });
    return;
  }

  // Set active hospital context and effective role for downstream RBAC checks
  req.user.hospitalId = requestedHospitalId;
  req.user.role = membership.role;
  (req as any).membership = membership;

  next();
};

