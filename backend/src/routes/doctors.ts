import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireHospitalContext } from '../middleware/rbac';
import Doctor from '../models/Doctor';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(requireHospitalContext);

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

    if (doctor.hospitalId !== req.user?.hospitalId) {
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

