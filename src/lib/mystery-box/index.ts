/**
 * Mystery Box Core Logic
 * Handles eligibility checking and mystery box generation
 */

import {
  getDailyPoolCount,
  initializeDailyPool,
  getUserDailyClaims,
  getUserRunHistory,
} from './storage';
import { generateMysteryBox } from './generator';

export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
}

export interface RunHistoryEntry {
  streak: number;
  timestamp: number;
}

/**
 * Check if user is eligible for a mystery box (hybrid algorithm)
 */
export async function checkEligibility(
  userId: string,
  currentStreak: number
): Promise<EligibilityResult> {
  // 1. Check daily pool availability
  let poolCount = await getDailyPoolCount();
  if (poolCount <= 0) {
    // Check if it's a new day and reset if needed
    poolCount = await initializeDailyPool();
    if (poolCount <= 0) {
      return { eligible: false, reason: 'Daily mystery boxes exhausted' };
    }
  }

  // 2. Check user's daily claim limit
  const dailyClaims = await getUserDailyClaims(userId);
  if (dailyClaims >= 2) {
    return { eligible: false, reason: 'Daily claim limit reached (2 per day)' };
  }

  // 3. Get user's run history
  const runHistory = await getUserRunHistory(userId);

  // 4. Engagement check: Has played 3+ games
  if (runHistory.length < 3) {
    return { eligible: false, reason: 'Need to play at least 3 games' };
  }

  // 5. Time away check: 24h+ OR 2+ games today
  const lastPlay = runHistory[0]?.timestamp || 0;
  const hoursSinceLastPlay = (Date.now() - lastPlay) / (1000 * 60 * 60);
  const gamesToday = runHistory.filter(r => {
    const date = new Date(r.timestamp);
    const today = new Date();
    return (
      date.getUTCFullYear() === today.getUTCFullYear() &&
      date.getUTCMonth() === today.getUTCMonth() &&
      date.getUTCDate() === today.getUTCDate()
    );
  }).length;

  const timeCondition = hoursSinceLastPlay >= 24 || gamesToday >= 2;
  if (!timeCondition) {
    return {
      eligible: false,
      reason: 'Time condition not met (need 24h away or 2+ games today)',
    };
  }

  // 6. Performance check: Below recent average
  const recentRuns = runHistory.slice(0, 10); // Last 10 runs
  if (recentRuns.length === 0) {
    return { eligible: false, reason: 'Insufficient run history' };
  }

  const avgStreak =
    recentRuns.reduce((sum, r) => sum + r.streak, 0) / recentRuns.length;
  
  if (currentStreak >= avgStreak) {
    return {
      eligible: false,
      reason: `Current streak (${currentStreak}) is not below average (${avgStreak.toFixed(1)})`,
    };
  }

  // All conditions met!
  return { eligible: true };
}

/**
 * Check if user can claim a mystery box (final check with pool decrement)
 */
export async function canClaimMysteryBox(userId: string): Promise<EligibilityResult> {
  // First check eligibility
  const eligibility = await checkEligibility(userId, 0); // We'll pass actual streak when claiming
  if (!eligibility.eligible) {
    return eligibility;
  }

  // Check pool count one more time
  const poolCount = await getDailyPoolCount();
  if (poolCount <= 0) {
    return { eligible: false, reason: 'Daily mystery boxes exhausted' };
  }

  return { eligible: true };
}

// Re-export generator
export { generateMysteryBox } from './generator';
export type { MysteryBox, MysteryBoxReward } from './generator';



