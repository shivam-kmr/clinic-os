import { Request, Response, NextFunction } from 'express';
import Hospital from '../models/Hospital';

/**
 * Middleware to extract hospital from subdomain or custom domain
 * Sets req.hospitalContext with the hospital if found
 */
export const extractHospitalFromDomain = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const host = req.get('host') || '';
    const hostname = host.split(':')[0]; // Remove port if present

    // For localhost development, check for hospital ID in header or query param
    if (hostname === 'localhost' || hostname.startsWith('localhost:')) {
      const hospitalId = req.headers['x-hospital-id'] as string || req.query.hospitalId as string;
      
      if (hospitalId) {
        const hospital = await Hospital.findByPk(hospitalId);
        if (hospital && hospital.status === 'ACTIVE') {
          req.hospitalContext = hospital;
          return next();
        }
      }
      
      // If no valid hospital ID provided, set to null
      req.hospitalContext = null;
      return next();
    }

    // Check if it's the main domain (clinicos.com) - no hospital context
    if (hostname === 'clinicos.com') {
      req.hospitalContext = null;
      return next();
    }

    // Check for subdomain (e.g., regencyhospital.clinicos.com)
    if (hostname.endsWith('.clinicos.com')) {
      const subdomain = hostname.replace('.clinicos.com', '');
      const hospital = await Hospital.findOne({
        where: { subdomain, status: 'ACTIVE' },
      });

      if (hospital) {
        req.hospitalContext = hospital;
        return next();
      }
    }

    // Check for custom domain (e.g., regencyhospital.com)
    const hospital = await Hospital.findOne({
      where: { 
        customDomain: hostname,
        customDomainVerified: true,
        status: 'ACTIVE' 
      },
    });

    if (hospital) {
      req.hospitalContext = hospital;
      return next();
    }

    // No hospital found - could be invalid subdomain/domain
    req.hospitalContext = null;
    next();
  } catch (error) {
    // On error, continue without hospital context
    req.hospitalContext = null;
    next();
  }
};

/**
 * Middleware to require hospital context (for patient portal routes)
 */
export const requireHospitalContext = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.hospitalContext) {
    return res.status(404).json({
      error: {
        code: 'HOSPITAL_NOT_FOUND',
        message: 'Hospital not found or inactive',
      },
    });
  }

  next();
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      hospitalContext?: Hospital | null;
    }
  }
}

