import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import Doctor from '../models/Doctor';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * Update doctor on-duty status
 * PATCH /api/v1/doctors/:doctorId/on-duty
 */
router.patch('/:doctorId/on-duty', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { doctorId } = req.params;
    const { onDuty } = req.body;

    if (typeof onDuty !== 'boolean') {
      res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: 'onDuty must be a boolean',
        },
      });
      return;
    }

    // Verify doctor belongs to user's hospital
    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Doctor not found',
        },
      });
      return;
    }

    // Get user's hospitalId
    let hospitalId = req.user?.hospitalId;
    if (!hospitalId) {
      const User = (await import('../models/User')).default;
      const user = await User.findByPk(req.user!.id);
      if (user && user.hospitalId) {
        hospitalId = user.hospitalId;
      }
    }

    if (doctor.hospitalId !== hospitalId) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied',
        },
      });
      return;
    }

    // Update status based on onDuty
    // For now, we'll use the status field: ACTIVE = on duty, ON_LEAVE = off duty
    await doctor.update({
      status: onDuty ? 'ACTIVE' : 'ON_LEAVE',
    });

    res.json({
      data: {
        doctorId: doctor.id,
        onDuty,
        status: doctor.status,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

