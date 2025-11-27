import { Router } from 'express';
import { QueueController } from '../controllers/QueueController';
import { authenticate } from '../middleware/auth';
import { requireRole, requireHospitalContext } from '../middleware/rbac';

const router = Router();

// All routes require authentication
router.use(authenticate);
// Note: requireHospitalContext is not applied here because controllers
// can derive hospitalId from doctor/department if user's hospitalId is null

// Get queue for doctor
router.get('/doctor/:doctorId', requireRole('RECEPTIONIST', 'DOCTOR', 'HOSPITAL_OWNER'), QueueController.getDoctorQueue);

// Get queue for department
router.get('/department/:departmentId', requireRole('RECEPTIONIST', 'DOCTOR', 'HOSPITAL_OWNER'), QueueController.getDepartmentQueue);

// Call next patient
router.post('/doctor/:doctorId/next', requireRole('DOCTOR', 'HOSPITAL_OWNER'), QueueController.callNext);

// Skip patient
router.post('/doctor/:doctorId/skip', requireRole('DOCTOR', 'HOSPITAL_OWNER'), QueueController.skip);

// Complete visit
router.post('/doctor/:doctorId/complete', requireRole('DOCTOR', 'HOSPITAL_OWNER'), QueueController.complete);

export default router;

