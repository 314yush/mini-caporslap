/**
 * Redis storage helpers for Mystery Box feature
 */

import { Redis } from '@upstash/redis';
import { getRedis } from '@/lib/redis';

// Redis key patterns
const KEYS = {
  dailyPool: (date: string) => `mystery-box:daily:${date}`,
  userClaims: (date: string, userId: string) => `mystery-box:claims:${date}:${userId}`,
  userRuns: (userId: string) => `user:${userId}:runs`,
  claimedBox: (boxId: string) => `mystery-box:claimed:${boxId}`,
};

/**
 * Get today's date in YYYY-MM-DD format (UTC)
 */
export function getTodayKey(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if a timestamp is today (UTC)
 */
export function isToday(timestamp: number): boolean {
  const date = new Date(timestamp);
  const today = new Date();
  return (
    date.getUTCFullYear() === today.getUTCFullYear() &&
    date.getUTCMonth() === today.getUTCMonth() &&
    date.getUTCDate() === today.getUTCDate()
  );
}

/**
 * Get daily pool count (remaining mystery boxes for today)
 */
export async function getDailyPoolCount(): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;
  
  try {
    const today = getTodayKey();
    const count = await redis.get<number>(KEYS.dailyPool(today));
    return count ?? 50; // Default to 50 if not set (first check of day)
  } catch (error) {
    console.error('[MysteryBox] Error getting daily pool count:', error);
    return 0;
  }
}

/**
 * Initialize or reset daily pool (called on first check of new day)
 */
export async function initializeDailyPool(): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;
  
  try {
    const today = getTodayKey();
    // Set to 50 with 25 hour TTL (slightly longer than 24h to handle edge cases)
    await redis.set(KEYS.dailyPool(today), 50, { ex: 25 * 60 * 60 });
    return 50;
  } catch (error) {
    console.error('[MysteryBox] Error initializing daily pool:', error);
    return 0;
  }
}

/**
 * Decrement daily pool count
 */
export async function decrementDailyPool(): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  
  try {
    const today = getTodayKey();
    const newCount = await redis.decr(KEYS.dailyPool(today));
    
    // If count went negative, reset to 0
    if (newCount < 0) {
      await redis.set(KEYS.dailyPool(today), 0, { ex: 25 * 60 * 60 });
      return false;
    }
    
    return newCount >= 0;
  } catch (error) {
    console.error('[MysteryBox] Error decrementing daily pool:', error);
    return false;
  }
}

/**
 * Get user's daily claim count
 */
export async function getUserDailyClaims(userId: string): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;
  
  try {
    const today = getTodayKey();
    const claims = await redis.get<number>(KEYS.userClaims(today, userId));
    return claims ?? 0;
  } catch (error) {
    console.error('[MysteryBox] Error getting user daily claims:', error);
    return 0;
  }
}

/**
 * Increment user's daily claim count
 */
export async function incrementUserDailyClaims(userId: string): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;
  
  try {
    const today = getTodayKey();
    const newCount = await redis.incr(KEYS.userClaims(today, userId));
    // Set TTL to 25 hours
    await redis.expire(KEYS.userClaims(today, userId), 25 * 60 * 60);
    return newCount;
  } catch (error) {
    console.error('[MysteryBox] Error incrementing user daily claims:', error);
    return 0;
  }
}

/**
 * Record a run for a user (for average calculation)
 */
export async function recordUserRun(userId: string, streak: number, timestamp: number): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  
  try {
    const runData = { streak, timestamp };
    const key = KEYS.userRuns(userId);
    
    // Add to list (left push to keep recent first)
    await redis.lpush(key, JSON.stringify(runData));
    
    // Keep only last 20 runs
    await redis.ltrim(key, 0, 19);
    
    // Set TTL to 30 days (keep history for a month)
    await redis.expire(key, 30 * 24 * 60 * 60);
  } catch (error) {
    console.error('[MysteryBox] Error recording user run:', error);
  }
}

/**
 * Get user's recent run history
 */
export async function getUserRunHistory(userId: string): Promise<Array<{ streak: number; timestamp: number }>> {
  const redis = getRedis();
  if (!redis) return [];
  
  try {
    const key = KEYS.userRuns(userId);
    const runs = await redis.lrange(key, 0, 19); // Get last 20
    
    if (!runs || !Array.isArray(runs)) {
      return [];
    }
    
    return runs.map((runStr: string) => {
      try {
        return JSON.parse(runStr) as { streak: number; timestamp: number };
      } catch {
        return { streak: 0, timestamp: 0 };
      }
    }).filter(r => r.streak > 0);
  } catch (error) {
    console.error('[MysteryBox] Error getting user run history:', error);
    return [];
  }
}

/**
 * Mark a mystery box as claimed
 */
export async function markBoxAsClaimed(boxId: string, userId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  
  try {
    await redis.set(KEYS.claimedBox(boxId), userId, { ex: 7 * 24 * 60 * 60 }); // 7 days
  } catch (error) {
    console.error('[MysteryBox] Error marking box as claimed:', error);
  }
}

/**
 * Check if a box has been claimed
 */
export async function isBoxClaimed(boxId: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  
  try {
    const claimed = await redis.get<string>(KEYS.claimedBox(boxId));
    return claimed !== null;
  } catch (error) {
    console.error('[MysteryBox] Error checking if box is claimed:', error);
    return false;
  }
}



