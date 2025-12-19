import { GuessResult } from './types';

/**
 * Calculates the new streak after a guess
 * @param currentStreak - Current streak count
 * @param result - Result of the guess
 * @returns New streak count (incremented or reset to 0)
 */
export function calculateNewStreak(
  currentStreak: number,
  result: GuessResult
): number {
  return result.correct ? currentStreak + 1 : 0;
}

/**
 * Checks if a streak qualifies for a reprieve
 * Minimum streak of 10 required
 * @param streak - Current streak
 * @returns Whether reprieve is available
 */
export function isReprieveEligible(streak: number): boolean {
  return streak >= 10;
}

/**
 * Generates streak display text
 * @param streak - Current streak
 * @returns Formatted streak text with emoji
 */
export function formatStreakDisplay(streak: number): string {
  if (streak === 0) return '';
  if (streak < 5) return `${streak}`;
  if (streak < 10) return `🔥 ${streak}`;
  if (streak < 20) return `🔥🔥 ${streak}`;
  return `🔥🔥🔥 ${streak}`;
}

/**
 * Gets the streak tier for styling purposes
 * @param streak - Current streak
 * @returns Tier level 0-3
 */
export function getStreakTier(streak: number): 0 | 1 | 2 | 3 {
  if (streak < 5) return 0;
  if (streak < 10) return 1;
  if (streak < 20) return 2;
  return 3;
}

/**
 * Generates celebratory text for streak milestones
 * @param streak - Current streak
 * @returns Milestone message or null
 */
export function getStreakMilestoneMessage(streak: number): string | null {
  const milestones: Record<number, string> = {
    5: 'Getting warmed up!',
    10: 'Double digits! 🎯',
    15: 'On fire! 🔥',
    20: 'Unstoppable! 💪',
    25: 'Market wizard! 🧙',
    50: 'LEGENDARY! 👑',
    100: 'Are you cheating?! 🤯',
  };
  return milestones[streak] || null;
}


