import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireHospitalContext, requireRole } from '../middleware/rbac';
import { ReceptionController } from '../controllers/ReceptionController';

const router = Router();

router.use(authenticate);
router.use(requireHospitalContext);

router.post('/intake', requireRole('RECEPTIONIST', 'HOSPITAL_OWNER', 'HOSPITAL_MANAGER', 'SUPERADMIN'), ReceptionController.intake);

export default router;



