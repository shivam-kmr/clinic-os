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
  consultationDuration: number | ((v: VisitAttributes) => number)
): number {
  const now = new Date();
  const visitPriority = calculateQueuePriority(visit, now);

  const durationFor =
    typeof consultationDuration === 'function' ? consultationDuration : () => consultationDuration;

  let total = 0;

  for (const v of queueAhead) {
    const vPriority = calculateQueuePriority(v, now);
    if (vPriority < visitPriority) continue;

    let d = Math.max(1, Number(durationFor(v) || 0));

    // If someone is currently being served, estimate remaining time instead of full duration.
    if (v.status === 'IN_PROGRESS' && v.startedAt) {
      const elapsed = differenceInMinutes(now, new Date(v.startedAt));
      d = Math.max(1, d - Math.max(0, elapsed));
    }

    total += d;
  }

  return Math.max(0, Math.round(total));
}

