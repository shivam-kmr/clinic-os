import { Router } from 'express';
import { VisitController } from '../controllers/VisitController';
import { authenticate } from '../middleware/auth';
import { requireRole, requireHospitalContext } from '../middleware/rbac';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(requireHospitalContext);

// Create walk-in visit
router.post('/', requireRole('RECEPTIONIST', 'HOSPITAL_OWNER'), VisitController.create);

// Get visit by ID
router.get('/:id', requireRole('RECEPTIONIST', 'DOCTOR', 'HOSPITAL_OWNER'), VisitController.getById);

// Update visit status
router.patch('/:id/status', requireRole('RECEPTIONIST', 'DOCTOR', 'HOSPITAL_OWNER'), VisitController.updateStatus);

// Reassign visit
router.post('/:id/reassign', requireRole('RECEPTIONIST', 'DOCTOR', 'HOSPITAL_OWNER'), VisitController.reassign);

// Delay patient
router.post('/:id/delay', requireRole('RECEPTIONIST', 'DOCTOR', 'HOSPITAL_OWNER'), VisitController.delay);

export default router;

