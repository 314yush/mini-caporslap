/**
 * Analytics tracking utilities for Vercel Analytics
 * Tracks game events, user actions, and key metrics
 */

import { track } from '@vercel/analytics';

/**
 * Track game start event
 */
export function trackGameStart(runId: string, userId: string) {
  track('game_start', {
    runId,
    userId: userId.slice(0, 8), // Truncate for privacy
  });
}

/**
 * Track guess event (correct or incorrect)
 */
export function trackGuess(
  runId: string,
  guess: 'cap' | 'slap',
  correct: boolean,
  streak: number,
  currentToken: string,
  nextToken: string
) {
  track('game_guess', {
    runId,
    guess,
    correct,
    streak,
    currentToken,
    nextToken,
  });
}

/**
 * Track streak milestone reached
 */
export function trackStreakMilestone(streak: number, runId: string) {
  // Track milestones at 5, 10, 20, 50, 100
  const milestones = [5, 10, 20, 50, 100];
  if (milestones.includes(streak)) {
    track('streak_milestone', {
      streak,
      runId,
      milestone: streak,
    });
  }
}

/**
 * Track game loss/end
 */
export function trackGameLoss(
  runId: string,
  finalStreak: number,
  usedReprieve: boolean,
  lastToken: string
) {
  track('game_loss', {
    runId,
    finalStreak,
    usedReprieve,
    lastToken,
  });
}

/**
 * Track reprieve payment initiated
 */
export function trackReprieveInitiated(runId: string, streak: number) {
  track('reprieve_initiated', {
    runId,
    streak,
  });
}

/**
 * Track reprieve payment completed
 */
export function trackReprieveCompleted(
  runId: string,
  streak: number,
  txHash: string
) {
  track('reprieve_completed', {
    runId,
    streak,
    txHash,
  });
}

/**
 * Track reprieve payment failed
 */
export function trackReprieveFailed(
  runId: string,
  streak: number,
  error: string
) {
  track('reprieve_failed', {
    runId,
    streak,
    error: error.slice(0, 50), // Truncate error message
  });
}

/**
 * Track wallet connection
 */
export function trackWalletConnect(address: string) {
  track('wallet_connect', {
    address: address.slice(0, 8), // Truncate for privacy
  });
}

/**
 * Track leaderboard submission
 */
export function trackLeaderboardSubmit(streak: number, rank?: number) {
  track('leaderboard_submit', {
    streak,
    rank,
  });
}
