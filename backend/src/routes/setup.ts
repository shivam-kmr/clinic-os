import { Router } from 'express';
import { HospitalSetupController } from '../controllers/HospitalSetupController';
import { DNSVerificationController } from '../controllers/DNSVerificationController';
import { authenticate } from '../middleware/auth';
import { requireRole, requireHospitalContext } from '../middleware/rbac';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get setup data - allow if user has hospitalId or is owner
router.get('/', HospitalSetupController.getSetup);

// Subdomain availability/suggestion (used during hospital creation)
router.get('/subdomain/suggest', HospitalSetupController.suggestSubdomain);

// Create hospital - allow any authenticated user without hospitalId
router.post('/hospital', HospitalSetupController.createHospital);

// All subsequent setup routes operate within an active hospital context
router.use(requireHospitalContext);

// Update hospital (for custom domain) - require hospital owner
router.patch('/hospital', requireRole('HOSPITAL_OWNER', 'HOSPITAL_MANAGER', 'SUPERADMIN'), HospitalSetupController.updateHospital);

// Update hospital config - require hospital owner or user with hospitalId
router.put('/hospital/config', requireRole('HOSPITAL_OWNER', 'HOSPITAL_MANAGER', 'SUPERADMIN'), HospitalSetupController.updateConfig);

// Create department - require hospital owner or user with hospitalId
router.post('/departments', requireRole('HOSPITAL_OWNER', 'SUPERADMIN'), HospitalSetupController.createDepartment);

// Department configuration (per-department behavior)
router.get(
  '/departments/:departmentId/config',
  requireRole('HOSPITAL_OWNER', 'HOSPITAL_MANAGER', 'SUPERADMIN'),
  HospitalSetupController.getDepartmentConfig
);
router.put(
  '/departments/:departmentId/config',
  requireRole('HOSPITAL_OWNER', 'HOSPITAL_MANAGER', 'SUPERADMIN'),
  HospitalSetupController.updateDepartmentConfig
);

// Create doctor - require hospital owner or user with hospitalId
router.post('/doctors', requireRole('HOSPITAL_OWNER', 'SUPERADMIN'), HospitalSetupController.createDoctor);

// Create receptionist - require hospital owner or user with hospitalId
router.post('/receptionists', requireRole('HOSPITAL_OWNER', 'HOSPITAL_MANAGER', 'SUPERADMIN'), HospitalSetupController.createReceptionist);

// DNS verification routes
router.post('/hospital/:hospitalId/verify-domain', requireRole('HOSPITAL_OWNER', 'HOSPITAL_MANAGER', 'SUPERADMIN'), DNSVerificationController.verifyDomain);
router.get('/hospital/:hospitalId/domain-instructions', requireRole('HOSPITAL_OWNER', 'HOSPITAL_MANAGER', 'SUPERADMIN'), DNSVerificationController.getInstructions);

export default router;

