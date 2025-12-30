/**
 * Weekly Leaderboard Score System
 * Tracks attempts and calculates weekly scores using formula: (Streak × 10) + Attempts
 */

import { Redis } from '@upstash/redis';

// Redis key patterns
const KEYS = {
  weeklyAttempts: (userId: string, weekKey: string) => `user:${userId}:attempts:${weekKey}`,
};

/**
 * Increments the weekly attempt counter for a user
 * @param redis - Redis client
 * @param userId - User ID
 * @param weekKey - Week key (YYYY-WW format)
 * @returns New attempt count
 */
export async function incrementWeeklyAttempts(
  redis: Redis,
  userId: string,
  weekKey: string
): Promise<number> {
  const key = KEYS.weeklyAttempts(userId, weekKey);
  
  // Increment and return new count
  const attempts = await redis.incr(key);
  
  // Set TTL to expire at end of week (7 days from now, but we'll set it conservatively)
  // Calculate seconds until next Sunday midnight UTC
  const now = new Date();
  const utcDate = new Date(now.toISOString());
  const day = utcDate.getUTCDay();
  const daysUntilSunday = day === 0 ? 7 : 7 - day;
  const secondsUntilNextWeek = (daysUntilSunday * 24 * 60 * 60) + 
    (23 - utcDate.getUTCHours()) * 60 * 60 + 
    (59 - utcDate.getUTCMinutes()) * 60 + 
    (60 - utcDate.getUTCSeconds());
  
  // Set TTL with some buffer (add 1 hour to be safe)
  await redis.expire(key, secondsUntilNextWeek + 3600);
  
  return attempts;
}

/**
 * Gets the current weekly attempt count for a user
 * @param redis - Redis client
 * @param userId - User ID
 * @param weekKey - Week key (YYYY-WW format)
 * @returns Attempt count (0 if not found)
 */
export async function getWeeklyAttempts(
  redis: Redis,
  userId: string,
  weekKey: string
): Promise<number> {
  const key = KEYS.weeklyAttempts(userId, weekKey);
  const attempts = await redis.get<number>(key);
  return attempts || 0;
}

/**
 * Calculates weekly score using formula: (Streak × 10) + Attempts
 * @param streak - User's best streak for the week
 * @param attempts - Number of attempts (games played) this week
 * @returns Calculated score
 */
export function calculateWeeklyScore(streak: number, attempts: number): number {
  return (streak * 10) + attempts;
}

