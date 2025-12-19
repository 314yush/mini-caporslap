/**
 * Analytics module - comprehensive game analytics
 * Exports all analytics functions for easy importing
 */

// Core game events
export {
  trackGameStart,
  trackGuess,
  trackStreakMilestone,
  trackGameLoss,
  trackReprieveInitiated,
  trackReprieveCompleted,
  trackReprieveFailed,
  trackWalletConnect,
  trackLeaderboardSubmit,
} from '../analytics';

// CoinGecko & infrastructure
export {
  trackCoinGeckoFetch,
  trackCoinGeckoRateLimit,
  trackTokenPoolRefresh,
} from '../analytics';

// Session tracking
export {
  startSession,
  endSession,
  getCurrentSession,
  updateActivity,
  trackGameStartInSession,
  trackGuessInSession,
  trackPlayTime,
  trackPageView,
  trackShareInSession,
  initSessionTracking,
} from './session';

// Engagement & timing
export {
  trackActionTiming,
  trackGuessTiming,
  trackDropOff,
  trackJourneyStep,
  trackDifficultyProgression,
  trackRetry,
  trackTokenInteraction,
  trackLeaderboardEngagement,
  trackSocialShare,
  trackReprieveDecision,
} from './engagement';
