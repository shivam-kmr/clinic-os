import { VisitAttributes } from '../models/Visit';
import { differenceInMinutes } from 'date-fns';

export interface QueueOrder {
  priority: number;
  visit: VisitAttributes;
}

/**
 * Calculate priority order for queue sorting
 * Priority: VIP > URGENT > CARRYOVER > CHECKED_IN (old day) > WAITING (old day) > New check-ins
 */
export function calculateQueuePriority(visit: VisitAttributes, today: Date): number {
  const checkedInDate = new Date(visit.checkedInAt);
  const isToday = 
    checkedInDate.getDate() === today.getDate() &&
    checkedInDate.getMonth() === today.getMonth() &&
    checkedInDate.getFullYear() === today.getFullYear();
  
  let priority = 0;
  
  // VIP gets highest priority
  if (visit.priority === 'VIP') {
    priority += 1000;
  } else if (visit.priority === 'URGENT') {
    priority += 900;
  }
  
  // Carryover patients (from previous days) get priority
  if (visit.isCarryover || !isToday) {
    priority += 800;
  }
  
  // Status priority: CHECKED_IN > WAITING
  if (visit.status === 'CHECKED_IN') {
    priority += 100;
  } else if (visit.status === 'WAITING') {
    priority += 50;
  }
  
  // Earlier check-in time gets higher priority (for same day)
  if (isToday) {
    priority += Math.max(0, 1000 - differenceInMinutes(today, checkedInDate));
  } else {
    // For carryover, earlier original check-in gets priority
    priority += Math.max(0, 1000 - differenceInMinutes(today, checkedInDate));
  }
  
  return priority;
}

/**
 * Sort visits by queue priority
 */
export function sortQueueByPriority(visits: VisitAttributes[]): VisitAttributes[] {
  const today = new Date();
  
  return visits
    .map((visit) => ({
      priority: calculateQueuePriority(visit, today),
      visit,
    }))
    .sort((a, b) => b.priority - a.priority) // Higher priority first
    .map((item) => item.visit);
}

/**
 * Calculate estimated wait time for a visit
 */
export function calculateEstimatedWaitTime(
  visit: VisitAttributes,
  queueAhead: VisitAttributes[],
  consultationDuration: number
): number {
  // Count visits ahead with same or higher priority
  const today = new Date();
  const visitPriority = calculateQueuePriority(visit, today);
  
  const aheadCount = queueAhead.filter((v) => {
    const vPriority = calculateQueuePriority(v, today);
    return vPriority >= visitPriority;
  }).length;
  
  return aheadCount * consultationDuration;
}

