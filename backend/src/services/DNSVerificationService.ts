import dns from 'dns';
import { promisify } from 'util';
import Hospital from '../models/Hospital';
import { logger } from '../config/logger';

const resolveTxt = promisify(dns.resolveTxt);
const resolveCname = promisify(dns.resolveCname);

/**
 * Service for DNS verification of custom domains
 */
export class DNSVerificationService {
  /**
   * Verify custom domain DNS configuration
   * Checks for CNAME record pointing to clinicos.com or TXT record with verification token
   */
  static async verifyCustomDomain(hospitalId: string): Promise<{
    verified: boolean;
    method?: 'CNAME' | 'TXT';
    error?: string;
  }> {
    try {
      const hospital = await Hospital.findByPk(hospitalId);
      if (!hospital || !hospital.customDomain) {
        return {
          verified: false,
          error: 'Hospital or custom domain not found',
        };
      }

      const domain = hospital.customDomain;
      const verificationToken = `clinicos-verify=${hospitalId}`;

      // Method 1: Check CNAME record
      try {
        const cnameRecords = await resolveCname(domain);
        const hasValidCname = cnameRecords.some(
          (record) => record.includes('clinicos.com') || record.includes('clinic-os')
        );

        if (hasValidCname) {
          logger.info(`Custom domain ${domain} verified via CNAME`);
          return {
            verified: true,
            method: 'CNAME',
          };
        }
      } catch (error: any) {
        // CNAME not found or invalid, try TXT
        if (error.code !== 'ENOTFOUND' && error.code !== 'ENODATA') {
          logger.warn(`CNAME check failed for ${domain}: ${error.message}`);
        }
      }

      // Method 2: Check TXT record
      try {
        const txtRecords = await resolveTxt(domain);
        const flattenedRecords = txtRecords.flat();
        const hasValidTxt = flattenedRecords.some(
          (record) => record.includes(verificationToken) || record.includes(`clinicos-verify=${hospitalId}`)
        );

        if (hasValidTxt) {
          logger.info(`Custom domain ${domain} verified via TXT`);
          return {
            verified: true,
            method: 'TXT',
          };
        }
      } catch (error: any) {
        // TXT not found
        if (error.code !== 'ENOTFOUND' && error.code !== 'ENODATA') {
          logger.warn(`TXT check failed for ${domain}: ${error.message}`);
        }
      }

      return {
        verified: false,
        error: 'No valid DNS records found. Please add a CNAME or TXT record.',
      };
    } catch (error: any) {
      logger.error(`DNS verification error for hospital ${hospitalId}: ${error.message}`);
      return {
        verified: false,
        error: error.message || 'DNS verification failed',
      };
    }
  }

  /**
   * Get DNS verification instructions for a hospital
   */
  static getVerificationInstructions(hospitalId: string, customDomain: string): {
    cname: string;
    txt: string;
    verificationToken: string;
  } {
    const verificationToken = `clinicos-verify=${hospitalId}`;
    return {
      cname: `CNAME record: ${customDomain} -> clinicos.com (or your Clinic OS hostname)`,
      txt: `TXT record: ${verificationToken}`,
      verificationToken,
    };
  }
}



