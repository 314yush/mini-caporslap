/**
 * Analytics tracking utilities
 * Supports both Vercel Analytics (Pro) and PostHog (Free)
 * Tracks game events, user actions, and key metrics
 */

import { track } from '@vercel/analytics';
import { track as trackServer } from '@vercel/analytics/server';
import { trackPostHog, isPostHogReady } from './analytics/posthog';

// Use PostHog if available, fallback to Vercel Analytics
const trackEvent = (event: string, properties?: Record<string, unknown>) => {
  // Try PostHog first (free tier supports custom events)
  if (isPostHogReady()) {
    trackPostHog(event, properties);
  }
  
  // Also track with Vercel if on Pro plan (for redundancy)
  // This will only work if you have Vercel Pro
  // Note: Vercel Analytics free tier doesn't support custom events
  try {
    if (properties) {
      // Filter properties to only include supported types
      const vercelProperties: Record<string, string | number | boolean> = {};
      for (const [key, value] of Object.entries(properties)) {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          vercelProperties[key] = value;
        }
      }
      track(event, vercelProperties);
    } else {
      track(event);
    }
  } catch (err) {
    // Silently fail if Vercel Analytics doesn't support custom events (free tier)
  }
};

/**
 * Track game start event
 * Enhanced with timing and context
 */
export function trackGameStart(
  runId: string, 
  userId: string,
  timeSinceLastGame?: number, // milliseconds since last game
  isRetry?: boolean
) {
  trackEvent('game_start', {
    runId,
    userId: userId.slice(0, 8), // Truncate for privacy
    timeSinceLastGame: timeSinceLastGame ? Math.round(timeSinceLastGame) : undefined,
    isRetry: isRetry ?? false,
    timestamp: Date.now(),
  });
}

/**
 * Track guess event (correct or incorrect)
 * Enhanced with timing and difficulty context
 */
export function trackGuess(
  runId: string,
  guess: 'cap' | 'slap',
  correct: boolean,
  streak: number,
  currentToken: string,
  nextToken: string,
  timeToGuess?: number, // milliseconds from token display to guess
  difficulty?: string,
  marketCapRatio?: number // ratio between tokens
) {
  trackEvent('game_guess', {
    runId,
    guess,
    correct,
    streak,
    currentToken,
    nextToken,
    timeToGuess: timeToGuess ? Math.round(timeToGuess) : undefined,
    difficulty,
    marketCapRatio: marketCapRatio ? Math.round(marketCapRatio * 100) / 100 : undefined,
    timestamp: Date.now(),
  });
}

/**
 * Track streak milestone reached
 */
export function trackStreakMilestone(streak: number, runId: string) {
  // Track milestones at 5, 10, 20, 50, 100
  const milestones = [5, 10, 20, 50, 100];
  if (milestones.includes(streak)) {
    trackEvent('streak_milestone', {
      streak,
      runId,
      milestone: streak,
    });
  }
}

/**
 * Track game loss/end
 * Enhanced with timing and session context
 */
export function trackGameLoss(
  runId: string,
  finalStreak: number,
  usedReprieve: boolean,
  lastToken: string,
  gameDuration?: number, // milliseconds
  totalGuesses?: number,
  accuracy?: number // percentage
) {
  trackEvent('game_loss', {
    runId,
    finalStreak,
    usedReprieve,
    lastToken,
    gameDuration: gameDuration ? Math.round(gameDuration) : undefined,
    gameDurationSeconds: gameDuration ? Math.round(gameDuration / 1000) : undefined,
    totalGuesses,
    accuracy,
    timestamp: Date.now(),
  });
}

/**
 * Track reprieve payment initiated
 */
export function trackReprieveInitiated(runId: string, streak: number) {
  trackEvent('reprieve_initiated', {
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
  trackEvent('reprieve_completed', {
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
  trackEvent('reprieve_failed', {
    runId,
    streak,
    error: error.slice(0, 50), // Truncate error message
  });
}

/**
 * Track wallet connection
 */
export function trackWalletConnect(address: string) {
  trackEvent('wallet_connect', {
    address: address.slice(0, 8), // Truncate for privacy
  });
}

/**
 * Track leaderboard submission
 */
export function trackLeaderboardSubmit(streak: number, rank?: number) {
  trackEvent('leaderboard_submit', {
    streak,
    rank,
  });
}

/**
 * Track CoinGecko API calls and performance
 * Uses server-side tracking for API routes
 */
export function trackCoinGeckoFetch(
  endpoint: string,
  tokenCount: number,
  duration: number,
  success: boolean,
  error?: string
) {
  try {
    trackServer('coingecko_fetch', {
      endpoint,
      tokenCount,
      duration: Math.round(duration), // Round to nearest ms
      success,
      error: error ? error.slice(0, 50) : undefined,
    });
  } catch (err) {
    // Silently fail analytics - don't break the flow
    console.warn('[Analytics] Failed to track coingecko_fetch:', err);
  }
}

/**
 * Track CoinGecko rate limit hit
 * Uses server-side tracking for API routes
 */
export function trackCoinGeckoRateLimit(endpoint: string) {
  try {
    trackServer('coingecko_rate_limit', {
      endpoint,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.warn('[Analytics] Failed to track coingecko_rate_limit:', err);
  }
}

/**
 * Track token pool refresh
 * Uses server-side tracking for API routes
 */
export function trackTokenPoolRefresh(
  tokenCount: number,
  source: 'coingecko' | 'dexscreener' | 'fallback',
  duration: number
) {
  try {
    trackServer('token_pool_refresh', {
      tokenCount,
      source,
      duration: Math.round(duration),
    });
  } catch (err) {
    console.warn('[Analytics] Failed to track token_pool_refresh:', err);
  }
}
