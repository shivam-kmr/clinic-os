import { Request, Response } from 'express';
import { DNSVerificationService } from '../services/DNSVerificationService';
import Hospital from '../models/Hospital';
import { errorHandler } from '../middleware/errorHandler';

export class DNSVerificationController {
  /**
   * POST /api/v1/setup/hospital/:hospitalId/verify-domain
   * Verify custom domain DNS configuration
   */
  static async verifyDomain(req: Request, res: Response): Promise<void> {
    try {
      const { hospitalId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      // Verify user has access to this hospital
      const hospital = await Hospital.findByPk(hospitalId);
      if (!hospital) {
        res.status(404).json({
          error: {
            code: 'HOSPITAL_NOT_FOUND',
            message: 'Hospital not found',
          },
        });
        return;
      }

      // Check if user is owner/manager of this hospital
      // This should be done via middleware, but for now we'll check here
      const userHospitalId = (req as any).user?.hospitalId;
      if (userHospitalId !== hospitalId && (req as any).user?.role !== 'SUPERADMIN') {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied',
          },
        });
        return;
      }

      const result = await DNSVerificationService.verifyCustomDomain(hospitalId);

      if (result.verified) {
        // Update hospital verification status
        await hospital.update({ customDomainVerified: true });
      }

      res.json({
        verified: result.verified,
        method: result.method,
        error: result.error,
      });
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * GET /api/v1/setup/hospital/:hospitalId/domain-instructions
   * Get DNS verification instructions
   */
  static async getInstructions(req: Request, res: Response): Promise<void> {
    try {
      const { hospitalId } = req.params;
      const hospital = await Hospital.findByPk(hospitalId);

      if (!hospital || !hospital.customDomain) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Hospital or custom domain not found',
          },
        });
        return;
      }

      const instructions = DNSVerificationService.getVerificationInstructions(
        hospitalId,
        hospital.customDomain
      );

      res.json({
        instructions,
        customDomain: hospital.customDomain,
      });
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }
}



