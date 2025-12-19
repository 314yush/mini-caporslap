/**
 * Session tracking for game analytics
 * Tracks user sessions, timing, and engagement metrics
 */

import { track } from '@vercel/analytics';

export interface SessionData {
  sessionId: string;
  startTime: number;
  userId: string;
  gameStarts: number;
  totalGuesses: number;
  correctGuesses: number;
  maxStreak: number;
  totalPlayTime: number; // in seconds
  lastActivity: number;
  pageViews: number;
  leaderboardViews: number;
  shares: number;
}

// In-memory session storage (client-side only)
let currentSession: SessionData | null = null;
let sessionStartTime: number | null = null;
let activityTimer: NodeJS.Timeout | null = null;

/**
 * Initialize a new session
 */
export function startSession(userId: string): string {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = Date.now();
  
  currentSession = {
    sessionId,
    startTime: now,
    userId,
    gameStarts: 0,
    totalGuesses: 0,
    correctGuesses: 0,
    maxStreak: 0,
    totalPlayTime: 0,
    lastActivity: now,
    pageViews: 1,
    leaderboardViews: 0,
    shares: 0,
  };
  
  sessionStartTime = now;
  
  // Track session start
  track('session_start', {
    sessionId,
    userId: userId.slice(0, 8),
    timestamp: now,
  });
  
  // Set up activity tracking
  startActivityTracking();
  
  return sessionId;
}

/**
 * End current session and send analytics
 */
export function endSession() {
  if (!currentSession || !sessionStartTime) return;
  
  const now = Date.now();
  const sessionDuration = Math.round((now - sessionStartTime) / 1000); // seconds
  
  // Calculate engagement score
  const engagementScore = calculateEngagementScore(currentSession, sessionDuration);
  
  // Track session end
  track('session_end', {
    sessionId: currentSession.sessionId,
    userId: currentSession.userId.slice(0, 8),
    duration: sessionDuration,
    gameStarts: currentSession.gameStarts,
    totalGuesses: currentSession.totalGuesses,
    correctGuesses: currentSession.correctGuesses,
    accuracy: currentSession.totalGuesses > 0 
      ? Math.round((currentSession.correctGuesses / currentSession.totalGuesses) * 100)
      : 0,
    maxStreak: currentSession.maxStreak,
    totalPlayTime: currentSession.totalPlayTime,
    pageViews: currentSession.pageViews,
    leaderboardViews: currentSession.leaderboardViews,
    shares: currentSession.shares,
    engagementScore,
  });
  
  // Clean up
  stopActivityTracking();
  currentSession = null;
  sessionStartTime = null;
}

/**
 * Get current session data
 */
export function getCurrentSession(): SessionData | null {
  return currentSession;
}

/**
 * Update session activity
 */
export function updateActivity() {
  if (!currentSession) return;
  
  const now = Date.now();
  currentSession.lastActivity = now;
  
  // Reset activity timer
  if (activityTimer) {
    clearTimeout(activityTimer);
  }
  
  // If no activity for 30 minutes, end session
  activityTimer = setTimeout(() => {
    endSession();
  }, 30 * 60 * 1000); // 30 minutes
}

/**
 * Track game start in session
 */
export function trackGameStartInSession() {
  if (!currentSession) return;
  currentSession.gameStarts++;
  updateActivity();
}

/**
 * Track guess in session
 */
export function trackGuessInSession(correct: boolean, streak: number) {
  if (!currentSession) return;
  currentSession.totalGuesses++;
  if (correct) {
    currentSession.correctGuesses++;
  }
  if (streak > currentSession.maxStreak) {
    currentSession.maxStreak = streak;
  }
  updateActivity();
}

/**
 * Track play time
 */
export function trackPlayTime(seconds: number) {
  if (!currentSession) return;
  currentSession.totalPlayTime += seconds;
  updateActivity();
}

/**
 * Track page view
 */
export function trackPageView(page: string) {
  if (!currentSession) return;
  if (page === 'leaderboard') {
    currentSession.leaderboardViews++;
  }
  currentSession.pageViews++;
  updateActivity();
}

/**
 * Track share
 */
export function trackShareInSession() {
  if (!currentSession) return;
  currentSession.shares++;
  updateActivity();
}

/**
 * Start activity tracking
 */
function startActivityTracking() {
  // Track activity on user interactions
  if (typeof window !== 'undefined') {
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });
  }
}

/**
 * Stop activity tracking
 */
function stopActivityTracking() {
  if (activityTimer) {
    clearTimeout(activityTimer);
    activityTimer = null;
  }
  
  if (typeof window !== 'undefined') {
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => {
      window.removeEventListener(event, updateActivity);
    });
  }
}

/**
 * Calculate engagement score (0-100)
 * Based on multiple factors: play time, guesses, accuracy, streaks
 */
function calculateEngagementScore(session: SessionData, duration: number): number {
  let score = 0;
  
  // Play time factor (max 30 points)
  const playTimeMinutes = session.totalPlayTime / 60;
  score += Math.min(30, (playTimeMinutes / 5) * 30); // 5 minutes = 30 points
  
  // Activity factor (max 25 points)
  const guessesPerMinute = duration > 0 ? (session.totalGuesses / (duration / 60)) : 0;
  score += Math.min(25, guessesPerMinute * 5); // 5 guesses/min = 25 points
  
  // Accuracy factor (max 20 points)
  if (session.totalGuesses > 0) {
    const accuracy = session.correctGuesses / session.totalGuesses;
    score += accuracy * 20;
  }
  
  // Streak factor (max 15 points)
  score += Math.min(15, session.maxStreak * 1.5); // 10 streak = 15 points
  
  // Engagement actions (max 10 points)
  score += Math.min(10, (session.leaderboardViews + session.shares) * 5);
  
  return Math.round(Math.min(100, score));
}

/**
 * Initialize session on page load
 */
export function initSessionTracking(userId: string) {
  if (typeof window === 'undefined') return;
  
  // Start session
  startSession(userId);
  
  // End session on page unload
  window.addEventListener('beforeunload', () => {
    endSession();
  });
  
  // Track page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Page hidden - pause tracking
    } else {
      // Page visible - resume tracking
      updateActivity();
    }
  });
}
