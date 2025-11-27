import { Router } from 'express';
import { SSEController } from '../controllers/SSEController';
import { authenticate, optionalAuth } from '../middleware/auth';
import { requireHospitalContext } from '../middleware/rbac';

const router = Router();

// SSE routes - authentication optional for waiting room (public view)
// Reception and doctor screens require authentication

// Reception dashboard SSE
router.get('/reception/:hospitalId', authenticate, requireHospitalContext, SSEController.reception);

// Doctor screen SSE
router.get('/doctor/:doctorId', authenticate, requireHospitalContext, SSEController.doctor);

// Waiting room SSE (public view, optional auth, no hospital context required)
router.get('/waiting-room/:departmentId', optionalAuth, SSEController.waitingRoom);

export default router;

