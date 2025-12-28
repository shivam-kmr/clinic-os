import { Router } from 'express';
import { optionalAuth } from '../middleware/auth';
import Department from '../models/Department';
import Doctor from '../models/Doctor';
import User from '../models/User';
import { QueueService } from '../services/QueueService';
import { PublicController } from '../controllers/PublicController';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { extractHospitalFromDomain } from '../middleware/hospitalContext';

const router = Router();

// Extract hospital from domain for public routes
router.use(extractHospitalFromDomain);

/**
 * Public endpoint to get department queue (for waiting room display)
 * GET /api/v1/public/queue/department/:departmentId
 */
router.get('/queue/department/:departmentId', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { departmentId } = req.params;

    // Verify department exists
    const department = await Department.findByPk(departmentId);

    if (!department) {
      res.status(404).json({
        error: {
          code: 'DEPARTMENT_NOT_FOUND',
          message: 'Department not found',
        },
      });
      return;
    }

    // If user is authenticated, verify they have access
    if (req.user?.hospitalId && req.user.hospitalId !== department.hospitalId) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied',
        },
      });
      return;
    }

    // Get queue for department (public view - no patient names)
    const queue = await QueueService.getQueueForDepartment(department.hospitalId, departmentId);

    // Doctors serving today (active doctors in this department)
    const doctors = await Doctor.findAll({
      where: {
        hospitalId: department.hospitalId,
        departmentId,
        status: 'ACTIVE',
      },
      include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName'] }],
      order: [['updatedAt', 'DESC']],
    });

    const servingDoctors = doctors
      .map((d: any) => {
        const first = String(d.user?.firstName || '').trim();
        const last = String(d.user?.lastName || '').trim();
        const full = `${first} ${last}`.trim();
        return full ? { id: String(d.id), name: `Dr. ${full}` } : { id: String(d.id), name: 'Doctor' };
      })
      .filter(Boolean);

    // Remove patient names for privacy in public view
    const publicQueue = {
      ...queue,
      departmentName: (department as any).name,
      servingDoctors,
      queue: queue.queue.map((item: any) => ({
        ...item,
        patientName: undefined, // Remove patient name for privacy
      })),
    };

    res.json({
      data: publicQueue,
    });
  } catch (error) {
    next(error);
  }
});

// Public hospital info endpoint
router.get('/hospital', PublicController.getHospitalInfo);

export default router;

