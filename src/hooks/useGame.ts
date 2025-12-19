'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  GameState, 
  Guess, 
  GuessResult,
  Run,
  Token
} from '@/lib/game-core/types';
import { compareMarketCaps, generateLossExplanation } from '@/lib/game-core/comparison';
import { getReprieveState } from '@/lib/game-core/reprieve';
import { getStreakTier, getStreakMilestoneMessage } from '@/lib/game-core/streak';
import { getTierName } from '@/lib/game-core/difficulty';
import { OvertakeEvent } from '@/lib/leaderboard/overtake';
import { LiveOvertakeData } from '@/components/game/LiveOvertakeToast';
import { 
  trackGuess, 
  trackGameLoss, 
  trackStreakMilestone,
  trackGameStart,
} from '@/lib/analytics';
import {
  trackGuessInSession,
  getCurrentSession,
} from '@/lib/analytics/session';
import {
  trackRetry,
  trackGuessTiming,
} from '@/lib/analytics/engagement';

interface UseGameReturn {
  // State
  gameState: GameState;
  isLoading: boolean;
  error: string | null;
  lastResult: GuessResult | null;
  lossExplanation: string | null;
  overtakes: OvertakeEvent[];
  liveOvertakes: LiveOvertakeData[];
  
  // Actions
  startGame: () => Promise<void>;
  makeGuess: (guess: Guess) => void;
  continueAfterCorrect: () => Promise<void>;
  activateReprieve: () => Promise<void>; // Called after payment is verified
  playAgain: () => void; // Start a new game
  clearLiveOvertakes: () => void; // Clear live overtake notifications
  
  // Derived
  canUseReprieve: boolean;
  streakTier: 0 | 1 | 2 | 3;
  milestoneMessage: string | null;
  completedRun: Run | null;
}

const initialGameState: GameState = {
  phase: 'playing',
  currentToken: null,
  nextToken: null,
  streak: 0,
  hasUsedReprieve: false,
  runId: '',
  preloadedTokens: [],
};

/**
 * Main game state management hook
 * Handles all game logic including guessing, streaks, and game flow
 */
export function useGame(userId: string): UseGameReturn {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<GuessResult | null>(null);
  const [completedRun, setCompletedRun] = useState<Run | null>(null);
  const [overtakes, setOvertakes] = useState<OvertakeEvent[]>([]);
  const [liveOvertakes, setLiveOvertakes] = useState<LiveOvertakeData[]>([]);
  
  // Analytics tracking refs
  const gameStartTimeRef = useRef<number | null>(null);
  const lastGameEndTimeRef = useRef<number | null>(null);
  const tokenDisplayTimeRef = useRef<number | null>(null);

  // Check for live overtakes after streak increases
  const checkLiveOvertakes = useCallback(async (newStreak: number, previousStreak: number) => {
    try {
      const response = await fetch('/api/leaderboard/check-overtakes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, currentStreak: newStreak, previousStreak }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.overtakes && data.overtakes.length > 0) {
          setLiveOvertakes(data.overtakes);
        }
      }
    } catch (err) {
      console.error('Failed to check overtakes:', err);
    }
  }, [userId]);

  // Clear live overtakes
  const clearLiveOvertakes = useCallback(() => {
    setLiveOvertakes([]);
  }, []);

  // Start a new game
  const startGame = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setLastResult(null);
    setCompletedRun(null);
    setOvertakes([]);
    setLiveOvertakes([]);
    
    try {
      // Fetch initial tokens from API
      const response = await fetch('/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[useGame] Failed to start game:', errorText);
        throw new Error('Failed to start game');
      }
      
      const data = await response.json();
      
      const now = Date.now();
      gameStartTimeRef.current = now;
      tokenDisplayTimeRef.current = now;
      
      setGameState({
        phase: 'playing',
        currentToken: data.currentToken,
        nextToken: data.nextToken,
        streak: 0,
        hasUsedReprieve: false,
        runId: data.runId,
        preloadedTokens: data.preloadedTokens || [],
      });
      
      // Track game start
      const timeSinceLastGame = lastGameEndTimeRef.current 
        ? now - lastGameEndTimeRef.current 
        : undefined;
      trackGameStart(data.runId, userId, timeSinceLastGame, !!lastGameEndTimeRef.current);
    } catch (err) {
      console.error('[useGame] startGame error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start game');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Make a guess
  const makeGuess = useCallback((guess: Guess) => {
    if (!gameState.currentToken || !gameState.nextToken) return;
    if (gameState.phase !== 'playing') return;
    
    // Calculate timing and context for analytics
    const timeToGuess = tokenDisplayTimeRef.current 
      ? Date.now() - tokenDisplayTimeRef.current 
      : undefined;
    const difficulty = getTierName(gameState.streak);
    const marketCapRatio = gameState.currentToken.marketCap > 0 && gameState.nextToken.marketCap > 0
      ? Math.max(gameState.currentToken.marketCap, gameState.nextToken.marketCap) / 
        Math.min(gameState.currentToken.marketCap, gameState.nextToken.marketCap)
      : undefined;
    
    // Compare market caps
    const result = compareMarketCaps(
      gameState.currentToken,
      gameState.nextToken,
      guess
    );
    
    setLastResult(result);
    
    // Track guess with analytics
    trackGuess(
      gameState.runId,
      guess,
      result.correct,
      gameState.streak,
      gameState.currentToken.symbol,
      gameState.nextToken.symbol,
      timeToGuess,
      difficulty,
      marketCapRatio
    );
    trackGuessInSession(result.correct, gameState.streak);
    
    // Track guess timing separately for detailed analysis
    if (timeToGuess !== undefined) {
      trackGuessTiming(timeToGuess, gameState.streak, difficulty, result.correct);
    }
    
    if (result.correct) {
      const newStreak = gameState.streak + 1;
      const previousStreak = gameState.streak;
      
      // Track streak milestones
      trackStreakMilestone(newStreak, gameState.runId);
      
      // Correct guess - show animation, then continue
      setGameState(prev => ({
        ...prev,
        phase: 'correct',
        streak: newStreak,
      }));
      
      // Check for live overtakes (fire and forget)
      checkLiveOvertakes(newStreak, previousStreak);
    } else {
      // Incorrect - game over
      const run: Run = {
        runId: gameState.runId,
        userId,
        streak: gameState.streak,
        usedReprieve: gameState.hasUsedReprieve,
        timestamp: Date.now(),
        lastToken: gameState.currentToken!,
        failedGuess: result,
      };
      
      setCompletedRun(run);
      setGameState(prev => ({
        ...prev,
        phase: 'loss',
      }));
      
      // Track game loss with analytics
      const gameDuration = gameStartTimeRef.current 
        ? Date.now() - gameStartTimeRef.current 
        : undefined;
      const session = getCurrentSession();
      const totalGuesses = session?.totalGuesses || 0;
      const accuracy = totalGuesses > 0 && session
        ? (session.correctGuesses / totalGuesses) * 100
        : undefined;
      
      trackGameLoss(
        gameState.runId,
        gameState.streak,
        gameState.hasUsedReprieve,
        gameState.currentToken.symbol,
        gameDuration,
        totalGuesses,
        accuracy
      );
      
      lastGameEndTimeRef.current = Date.now();
      
      // Submit to leaderboard and capture overtakes
      fetch('/api/leaderboard/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ run, userId }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.overtakes && data.overtakes.length > 0) {
            setOvertakes(data.overtakes);
          }
        })
        .catch(console.error);
    }
  }, [gameState, userId]);

  // Background fetch more tokens when running low
  const fetchMoreTokens = useCallback(async (currentTokenId: string, recentTokenIds: string[]) => {
    try {
      const response = await fetch('/api/tokens/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          currentTokenId,
          recentTokenIds,
          count: 5,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.tokens && data.tokens.length > 0) {
          setGameState(prev => ({
            ...prev,
            preloadedTokens: [...prev.preloadedTokens, ...data.tokens],
          }));
          console.log('[useGame] Preloaded', data.tokens.length, 'more tokens');
        }
      }
    } catch (err) {
      console.error('[useGame] Failed to preload tokens:', err);
      // Non-critical, don't show error to user
    }
  }, []);

  // Continue after correct guess animation
  const continueAfterCorrect = useCallback(async () => {
    if (gameState.phase !== 'correct') return;
    
    // Use preloaded token if available (instant, no loading)
    if (gameState.preloadedTokens.length > 0) {
      const nextPreloaded = gameState.preloadedTokens[0];
      const remainingPreloaded = gameState.preloadedTokens.slice(1);
      
      setGameState(prev => ({
        ...prev,
        phase: 'playing',
        currentToken: prev.nextToken,
        nextToken: nextPreloaded,
        preloadedTokens: remainingPreloaded,
      }));
      
      // Update token display time for next guess timing
      tokenDisplayTimeRef.current = Date.now();
      
      // Track play time in session
      if (gameStartTimeRef.current) {
        const playTimeSeconds = Math.round((Date.now() - gameStartTimeRef.current) / 1000);
        const { trackPlayTime } = await import('@/lib/analytics/session');
        trackPlayTime(playTimeSeconds);
      }
      
      // If we're running low on preloaded tokens, fetch more in background
      if (remainingPreloaded.length <= 2) {
        const recentIds = [
          gameState.currentToken?.id,
          gameState.nextToken?.id,
          nextPreloaded.id,
        ].filter(Boolean) as string[];
        
        // Fire and forget - fetch more tokens in background
        fetchMoreTokens(nextPreloaded.id, recentIds);
      }
      
      return; // No loading state needed!
    }
    
    // Fallback: fetch from API if no preloaded tokens (shouldn't happen normally)
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/tokens/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          currentTokenId: gameState.nextToken?.id,
          runId: gameState.runId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get next token');
      }
      
      const data = await response.json();
      
      setGameState(prev => ({
        ...prev,
        phase: 'playing',
        currentToken: prev.nextToken,
        nextToken: data.nextToken,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to continue');
    } finally {
      setIsLoading(false);
    }
  }, [gameState, fetchMoreTokens]);

  // Activate reprieve (called AFTER payment is verified)
  // This just resumes the game - payment verification happens separately
  const activateReprieve = useCallback(async () => {
    if (gameState.phase !== 'loss') return;
    if (gameState.hasUsedReprieve) return;
    if (gameState.streak < 5) return; // Min streak requirement
    
    // Use preloaded token if available
    if (gameState.preloadedTokens.length > 0) {
      const nextPreloaded = gameState.preloadedTokens[0];
      const remainingPreloaded = gameState.preloadedTokens.slice(1);
      
      setGameState(prev => ({
        ...prev,
        phase: 'playing',
        nextToken: nextPreloaded,
        hasUsedReprieve: true,
        preloadedTokens: remainingPreloaded,
      }));
      
      setLastResult(null);
      setCompletedRun(null);
      
      // Fetch more tokens in background if needed
      if (remainingPreloaded.length <= 2 && gameState.currentToken) {
        const recentIds = [
          gameState.currentToken.id,
          nextPreloaded.id,
        ].filter(Boolean) as string[];
        fetchMoreTokens(nextPreloaded.id, recentIds);
      }
      
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Fetch a new token to continue with
      const response = await fetch('/api/tokens/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          currentTokenId: gameState.currentToken?.id,
          runId: gameState.runId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get next token');
      }
      
      const data = await response.json();
      
      // Continue the game with the current token and a new next token
      // The failed comparison is discarded
      setGameState(prev => ({
        ...prev,
        phase: 'playing',
        nextToken: data.nextToken,
        hasUsedReprieve: true,
      }));
      
      setLastResult(null);
      setCompletedRun(null);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to use reprieve');
    } finally {
      setIsLoading(false);
    }
  }, [gameState, fetchMoreTokens]);

  // Play again (start fresh)
  const playAgain = useCallback(() => {
    // Track retry analytics
    const previousStreak = gameState.streak;
    const timeSinceLoss = lastGameEndTimeRef.current 
      ? Date.now() - lastGameEndTimeRef.current 
      : 0;
    const timeBetweenGames = lastGameEndTimeRef.current && gameStartTimeRef.current
      ? Date.now() - lastGameEndTimeRef.current
      : 0;
    
    trackRetry(previousStreak, timeSinceLoss, timeBetweenGames);
    
    // Reset to initial state, then start new game
    setGameState({
      ...initialGameState,
      preloadedTokens: [],
    });
    setLastResult(null);
    setCompletedRun(null);
    setOvertakes([]);
    setLiveOvertakes([]);
    gameStartTimeRef.current = null;
    tokenDisplayTimeRef.current = null;
  }, [gameState.streak]);

  // Auto-start game on mount or after playAgain
  useEffect(() => {
    console.log('[useGame] Auto-start check:', { 
      hasRunId: !!gameState.runId, 
      userId,
      shouldStart: !gameState.runId && userId 
    });
    if (!gameState.runId && userId) {
      console.log('[useGame] Starting game for userId:', userId);
      startGame();
    } else if (!userId) {
      console.log('[useGame] Cannot start game - no userId');
    }
  }, [userId, gameState.runId, startGame]);

  // Derived values
  const reprieveState = getReprieveState(gameState.streak, gameState.hasUsedReprieve);
  const streakTier = getStreakTier(gameState.streak);
  const milestoneMessage = getStreakMilestoneMessage(gameState.streak);
  const lossExplanation = lastResult && !lastResult.correct 
    ? generateLossExplanation(lastResult)
    : null;

  return {
    gameState,
    isLoading,
    error,
    lastResult,
    lossExplanation,
    overtakes,
    liveOvertakes,
    startGame,
    makeGuess,
    continueAfterCorrect,
    activateReprieve,
    playAgain,
    clearLiveOvertakes,
    canUseReprieve: reprieveState.available,
    streakTier,
    milestoneMessage,
    completedRun,
  };
}
