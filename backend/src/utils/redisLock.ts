import redisClient from '../config/redis';
import { logger } from '../config/logger';

const LOCK_TTL = 30; // seconds

export async function acquireLock(
  key: string,
  ttl: number = LOCK_TTL
): Promise<boolean> {
  try {
    const result = await redisClient.setNX(key, '1');
    if (result) {
      await redisClient.expire(key, ttl);
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Error acquiring lock:', error);
    return false;
  }
}

export async function releaseLock(key: string): Promise<void> {
  try {
    await redisClient.del(key);
  } catch (error) {
    logger.error('Error releasing lock:', error);
  }
}

export function getQueueLockKey(hospitalId: string, doctorId?: string, departmentId?: string): string {
  if (doctorId) {
    return `queue:lock:${hospitalId}:doctor:${doctorId}`;
  }
  if (departmentId) {
    return `queue:lock:${hospitalId}:department:${departmentId}`;
  }
  return `queue:lock:${hospitalId}`;
}

export async function withLock<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = LOCK_TTL,
  retries: number = 3,
  delay: number = 100
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    const acquired = await acquireLock(key, ttl);
    if (acquired) {
      try {
        const result = await fn();
        return result;
      } finally {
        await releaseLock(key);
      }
    }
    
    if (i < retries - 1) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`Failed to acquire lock after ${retries} attempts`);
}

