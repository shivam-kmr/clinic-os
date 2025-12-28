import { Router } from 'express';
import { PatientAuthController } from '../controllers/PatientAuthController';
import { PatientController } from '../controllers/PatientController';
import { extractHospitalFromDomain, requireHospitalContext } from '../middleware/hospitalContext';
import { authenticatePatient } from '../middleware/patientAuth';

const router = Router();

// All patient routes require hospital context from subdomain/domain
router.use(extractHospitalFromDomain);

// Public patient routes (no auth required)
router.post('/auth/login', requireHospitalContext, PatientAuthController.login);
router.post('/auth/register', requireHospitalContext, PatientAuthController.register);

// Protected patient routes
router.use(requireHospitalContext);
router.use(authenticatePatient);

router.get('/auth/me', PatientAuthController.getCurrentPatient);

// Patient booking and queue endpoints
router.get('/departments', PatientController.getDepartments);
router.get('/doctors', PatientController.getDoctors);
router.get('/doctors/:doctorId', PatientController.getDoctor);
router.post('/appointments', PatientController.createAppointment);
router.get('/appointments', PatientController.getMyAppointments);
router.get('/appointments/:appointmentId', PatientController.getAppointment);
router.patch('/appointments/:appointmentId/cancel', PatientController.cancelAppointment);
router.patch('/appointments/:appointmentId/reschedule', PatientController.rescheduleAppointment);
router.get('/queue-position', PatientController.getQueuePosition);
router.get('/history', PatientController.getHistory);

export default router;



