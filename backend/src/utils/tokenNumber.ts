import { Op } from 'sequelize';
import Visit from '../models/Visit';
import { logger } from '../config/logger';

/**
 * Get next token number for a doctor
 * Handles token reset based on hospital configuration
 */
export async function getNextTokenNumber(
  hospitalId: string,
  doctorId: string,
  tokenResetFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'NEVER'
): Promise<number> {
  const today = new Date();
  let startDate: Date;
  
  switch (tokenResetFrequency) {
    case 'DAILY':
      startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      break;
    case 'WEEKLY':
      const dayOfWeek = today.getDay();
      startDate = new Date(today);
      startDate.setDate(today.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'MONTHLY':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case 'NEVER':
      startDate = new Date(0); // Beginning of time
      break;
    default:
      startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }
  
  try {
    // Get the highest token number for this doctor since reset date
    const lastVisit = await Visit.findOne({
      where: {
        hospitalId,
        doctorId,
        createdAt: {
          [Op.gte]: startDate,
        },
      },
      order: [['tokenNumber', 'DESC']],
    });
    
    if (lastVisit) {
      return lastVisit.tokenNumber + 1;
    }
    
    return 1;
  } catch (error) {
    logger.error('Error getting next token number:', error);
    throw error;
  }
}

