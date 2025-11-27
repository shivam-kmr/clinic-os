import { Router } from 'express';
import { AppointmentController } from '../controllers/AppointmentController';
import { authenticate } from '../middleware/auth';
import { requireRole, requireHospitalContext } from '../middleware/rbac';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(requireHospitalContext);

// Create appointment
router.post('/', requireRole('RECEPTIONIST', 'HOSPITAL_OWNER'), AppointmentController.create);

// List appointments
router.get('/', requireRole('RECEPTIONIST', 'DOCTOR', 'HOSPITAL_OWNER'), AppointmentController.list);

// Get appointment by ID
router.get('/:id', requireRole('RECEPTIONIST', 'DOCTOR', 'HOSPITAL_OWNER'), AppointmentController.getById);

// Check-in appointment
router.post('/:id/check-in', requireRole('RECEPTIONIST', 'HOSPITAL_OWNER'), AppointmentController.checkIn);

// Cancel appointment
router.delete('/:id', requireRole('RECEPTIONIST', 'HOSPITAL_OWNER'), AppointmentController.cancel);

// Reschedule appointment
router.patch('/:id/reschedule', requireRole('RECEPTIONIST', 'HOSPITAL_OWNER'), AppointmentController.reschedule);

export default router;

