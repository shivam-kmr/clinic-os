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
  

  // IMPORTANT:
  // This value is used only for sorting/comparisons. Higher number means "earlier in queue".
  // It must be deterministic and must NOT accidentally put newer check-ins ahead of older ones.
  let score = 0;

  // VIP / urgent
  const priorityRank = visit.priority === 'VIP' ? 2 : visit.priority === 'URGENT' ? 1 : 0;
  score += priorityRank * 1_000_000_000_000; // 1e12

  // Carryover / previous-day visits should come before same-day visits
  const carryoverRank = visit.isCarryover || !isToday ? 1 : 0;
  score += carryoverRank * 100_000_000_000; // 1e11

  // Status ordering inside the queue
  const statusRank =
    visit.status === 'IN_PROGRESS'
      ? 4
      : visit.status === 'CHECKED_IN'
      ? 3
      : visit.status === 'WAITING'
      ? 2
      : visit.status === 'CARRYOVER'
      ? 2
      : visit.status === 'ON_HOLD'
      ? 1
      : 0;
  score += statusRank * 10_000_000_000; // 1e10

  // Earlier check-in should be ahead of later check-in.
  // Convert to epoch minutes and invert so "earlier" => larger.
  const checkedInMinutes = Math.floor(checkedInDate.getTime() / 60_000);
  const timeScore = 1_000_000_000 - checkedInMinutes; // ~972M today; always positive in this century
  score += timeScore * 100; // keep this below statusRank weight

  // Earlier token should be ahead (lower tokenNumber => larger score)
  const tokenNumber = Number((visit as any).tokenNumber || 0);
  if (Number.isFinite(tokenNumber)) {
    score += Math.max(0, 100_000 - tokenNumber);
  }

  return score;
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
    .sort((a, b) => {
      // Higher priority first
      const p = b.priority - a.priority;
      if (p !== 0) return p;

      // Deterministic tie-breakers to avoid "random" ordering across runs:
      const aChecked = new Date(a.visit.checkedInAt).getTime();
      const bChecked = new Date(b.visit.checkedInAt).getTime();
      if (aChecked !== bChecked) return aChecked - bChecked; // earlier first

      const aToken = Number((a.visit as any).tokenNumber || 0);
      const bToken = Number((b.visit as any).tokenNumber || 0);
      if (aToken !== bToken) return aToken - bToken; // lower token first

      const aId = String((a.visit as any).id || '');
      const bId = String((b.visit as any).id || '');
      return aId.localeCompare(bId);
    })
    .map((item) => item.visit);
}

/**
 * Calculate estimated wait time for a visit
 */
export function calculateEstimatedWaitTime(
  _visit: VisitAttributes,
  queueAhead: VisitAttributes[],
  consultationDuration: number | ((v: VisitAttributes) => number)
): number {
  const now = new Date();

  const durationFor =
    typeof consultationDuration === 'function' ? consultationDuration : () => consultationDuration;

  let total = 0;

  for (const v of queueAhead) {
    // queueAhead is already sorted; every item in it is ahead of this visit in the queue.
    // Do not re-filter by a secondary priority function (it can cause unexpected ordering).

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

