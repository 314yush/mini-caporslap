/**
 * Engagement and timing analytics
 * Tracks user engagement patterns, timing, and drop-off points
 */

import { trackPostHog, isPostHogReady } from './posthog';

// Use PostHog if available, fallback to console (for debugging)
const trackEngagementEvent = (event: string, properties?: Record<string, unknown>) => {
  if (isPostHogReady()) {
    trackPostHog(event, properties);
  } else if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', event, properties);
  }
};

/**
 * Track time between actions (for engagement analysis)
 */
export function trackActionTiming(
  action: string,
  timeSinceLastAction: number, // in milliseconds
  context?: Record<string, string | number | boolean>
) {
  trackEngagementEvent('action_timing', {
    action,
    timeSinceLastAction: Math.round(timeSinceLastAction),
    timeSinceLastActionSeconds: Math.round(timeSinceLastAction / 1000),
    ...context,
  });
}

/**
 * Track guess timing (how long user takes to make a guess)
 */
export function trackGuessTiming(
  timeToGuess: number, // milliseconds from token display to guess
  streak: number,
  difficulty: string,
  correct: boolean
) {
  trackEngagementEvent('guess_timing', {
    timeToGuess: Math.round(timeToGuess),
    timeToGuessSeconds: Math.round(timeToGuess / 1000),
    streak,
    difficulty,
    correct,
    speedCategory: getSpeedCategory(timeToGuess),
  });
}

/**
 * Track drop-off points (where users leave)
 */
export function trackDropOff(
  stage: 'landing' | 'game_start' | 'first_guess' | 'mid_game' | 'loss_screen' | 'leaderboard',
  timeOnStage: number, // milliseconds
  streak?: number
) {
  trackEngagementEvent('drop_off', {
    stage,
    timeOnStage: Math.round(timeOnStage),
    timeOnStageSeconds: Math.round(timeOnStage / 1000),
    streak,
  });
}

/**
 * Track user journey through the game
 */
export function trackJourneyStep(
  step: 'landing_view' | 'game_start' | 'first_guess' | 'streak_5' | 'streak_10' | 'loss' | 'share' | 'leaderboard_view' | 'play_again',
  timeToStep: number, // milliseconds from session start
  streak?: number
) {
  trackEngagementEvent('journey_step', {
    step,
    timeToStep: Math.round(timeToStep),
    timeToStepSeconds: Math.round(timeToStep / 1000),
    streak,
  });
}

/**
 * Track difficulty progression
 */
export function trackDifficultyProgression(
  previousDifficulty: string,
  currentDifficulty: string,
  streak: number,
  timeAtDifficulty: number // milliseconds
) {
  trackEngagementEvent('difficulty_progression', {
    previousDifficulty,
    currentDifficulty,
    streak,
    timeAtDifficulty: Math.round(timeAtDifficulty),
    timeAtDifficultySeconds: Math.round(timeAtDifficulty / 1000),
  });
}

/**
 * Track retry behavior (play again after loss)
 */
export function trackRetry(
  previousStreak: number,
  timeSinceLoss: number, // milliseconds
  timeBetweenGames: number // milliseconds
) {
  trackEngagementEvent('retry', {
    previousStreak,
    timeSinceLoss: Math.round(timeSinceLoss),
    timeSinceLossSeconds: Math.round(timeSinceLoss / 1000),
    timeBetweenGames: Math.round(timeBetweenGames),
    timeBetweenGamesSeconds: Math.round(timeBetweenGames / 1000),
    retrySpeed: getRetrySpeedCategory(timeSinceLoss),
  });
}

/**
 * Track token interaction (hover, click, tooltip views)
 */
export function trackTokenInteraction(
  interaction: 'hover' | 'click' | 'tooltip_open' | 'tooltip_close',
  tokenSymbol: string,
  timeOnToken: number // milliseconds
) {
  trackEngagementEvent('token_interaction', {
    interaction,
    tokenSymbol,
    timeOnToken: Math.round(timeOnToken),
  });
}

/**
 * Track leaderboard engagement
 */
export function trackLeaderboardEngagement(
  action: 'view' | 'scroll' | 'filter' | 'share',
  timeOnLeaderboard: number, // milliseconds
  rank?: number
) {
  trackEngagementEvent('leaderboard_engagement', {
    action,
    timeOnLeaderboard: Math.round(timeOnLeaderboard),
    rank,
  });
}

/**
 * Track social sharing
 */
export function trackSocialShare(
  platform: 'twitter' | 'farcaster' | 'copy_link' | 'other',
  streak: number,
  shareContext: 'loss' | 'milestone' | 'leaderboard' | 'win'
) {
  trackEngagementEvent('social_share', {
    platform,
    streak,
    shareContext,
  });
}

/**
 * Track reprieve decision
 */
export function trackReprieveDecision(
  decision: 'initiated' | 'completed' | 'cancelled' | 'failed',
  streak: number,
  timeToDecide: number, // milliseconds from loss to decision
  paymentTime?: number // milliseconds for payment completion
) {
  trackEngagementEvent('reprieve_decision', {
    decision,
    streak,
    timeToDecide: Math.round(timeToDecide),
    timeToDecideSeconds: Math.round(timeToDecide / 1000),
    paymentTime: paymentTime ? Math.round(paymentTime) : undefined,
    paymentTimeSeconds: paymentTime ? Math.round(paymentTime / 1000) : undefined,
  });
}

/**
 * Get speed category for guess timing
 */
function getSpeedCategory(timeMs: number): 'instant' | 'fast' | 'medium' | 'slow' | 'very_slow' {
  if (timeMs < 1000) return 'instant';
  if (timeMs < 3000) return 'fast';
  if (timeMs < 10000) return 'medium';
  if (timeMs < 30000) return 'slow';
  return 'very_slow';
}

/**
 * Get retry speed category
 */
function getRetrySpeedCategory(timeMs: number): 'immediate' | 'quick' | 'delayed' | 'returning' {
  if (timeMs < 5000) return 'immediate';
  if (timeMs < 30000) return 'quick';
  if (timeMs < 300000) return 'delayed'; // 5 minutes
  return 'returning';
}






