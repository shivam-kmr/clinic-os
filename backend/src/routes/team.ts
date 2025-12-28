import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireHospitalContext, requireRole } from '../middleware/rbac';
import { TeamController } from '../controllers/TeamController';

const router = Router();

router.use(authenticate);
router.use(requireHospitalContext);

router.get('/', requireRole('SUPERADMIN', 'HOSPITAL_OWNER', 'HOSPITAL_MANAGER'), TeamController.list);

export default router;



