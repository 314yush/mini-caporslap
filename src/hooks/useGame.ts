'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  GameState, 
  Guess, 
  GuessResult,
  Run 
} from '@/lib/game-core/types';
import { compareMarketCaps, generateLossExplanation } from '@/lib/game-core/comparison';
import { getReprieveState } from '@/lib/game-core/reprieve';
import { getStreakTier, getStreakMilestoneMessage } from '@/lib/game-core/streak';
import { OvertakeEvent } from '@/lib/leaderboard/overtake';
import { LiveOvertakeData } from '@/components/game/LiveOvertakeToast';

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
          console.log('[useGame] Live overtakes:', data.overtakes);
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
    console.log('[useGame] startGame() called for userId:', userId);
    setIsLoading(true);
    setError(null);
    setLastResult(null);
    setCompletedRun(null);
    setOvertakes([]);
    setLiveOvertakes([]);
    
    try {
      // Fetch initial tokens from API
      console.log('[useGame] Calling /api/game/start...');
      const response = await fetch('/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      console.log('[useGame] /api/game/start response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[useGame] Failed to start game:', errorText);
        throw new Error('Failed to start game');
      }
      
      const data = await response.json();
      console.log('[useGame] Game started:', {
        runId: data.runId,
        currentToken: data.currentToken?.symbol,
        nextToken: data.nextToken?.symbol,
      });
      
      setGameState({
        phase: 'playing',
        currentToken: data.currentToken,
        nextToken: data.nextToken,
        streak: 0,
        hasUsedReprieve: false,
        runId: data.runId,
      });
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
    
    // Compare market caps
    const result = compareMarketCaps(
      gameState.currentToken,
      gameState.nextToken,
      guess
    );
    
    setLastResult(result);
    
    if (result.correct) {
      const newStreak = gameState.streak + 1;
      const previousStreak = gameState.streak;
      
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
      
      // Submit to leaderboard and capture overtakes
      fetch('/api/leaderboard/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ run, userId }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.overtakes && data.overtakes.length > 0) {
            console.log('[useGame] Overtakes detected:', data.overtakes);
            setOvertakes(data.overtakes);
          }
        })
        .catch(console.error);
    }
  }, [gameState, userId]);

  // Continue after correct guess animation
  const continueAfterCorrect = useCallback(async () => {
    if (gameState.phase !== 'correct') return;
    
    setIsLoading(true);
    
    try {
      // Fetch next token
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
  }, [gameState]);

  // Activate reprieve (called AFTER payment is verified)
  // This just resumes the game - payment verification happens separately
  const activateReprieve = useCallback(async () => {
    if (gameState.phase !== 'loss') return;
    if (gameState.hasUsedReprieve) return;
    if (gameState.streak < 5) return; // Min streak requirement
    
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
  }, [gameState]);

  // Play again (start fresh)
  const playAgain = useCallback(() => {
    // Reset to initial state, then start new game
    setGameState(initialGameState);
    setLastResult(null);
    setCompletedRun(null);
    setOvertakes([]);
    setLiveOvertakes([]);
  }, []);

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
