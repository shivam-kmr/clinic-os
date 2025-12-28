import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireHospitalContext, requireRole } from '../middleware/rbac';
import { ReceptionController } from '../controllers/ReceptionController';

const router = Router();

router.use(authenticate);
router.use(requireHospitalContext);

router.post('/intake', requireRole('RECEPTIONIST', 'HOSPITAL_OWNER', 'HOSPITAL_MANAGER', 'SUPERADMIN'), ReceptionController.intake);
router.get(
  '/patients/by-phone',
  requireRole('RECEPTIONIST', 'HOSPITAL_OWNER', 'HOSPITAL_MANAGER', 'SUPERADMIN'),
  ReceptionController.patientsByPhone
);
router.get(
  '/metrics/today',
  requireRole('RECEPTIONIST', 'HOSPITAL_OWNER', 'HOSPITAL_MANAGER', 'SUPERADMIN'),
  ReceptionController.metricsToday
);
router.get(
  '/metrics/live',
  requireRole('RECEPTIONIST', 'HOSPITAL_OWNER', 'HOSPITAL_MANAGER', 'SUPERADMIN'),
  ReceptionController.metricsLive
);

export default router;



