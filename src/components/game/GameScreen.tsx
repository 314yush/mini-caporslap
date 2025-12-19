'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useGame, useIdentity, useGameTimer, useAuth } from '@/hooks';
import { Token, Guess } from '@/lib/game-core/types';
import { formatMarketCap } from '@/lib/game-core/comparison';
import { CorrectOverlay } from './CorrectOverlay';
import { LossScreen } from './LossScreen';
import { TokenInfoTooltip } from './TokenInfoTooltip';
import { GameTimer } from './GameTimer';
import { LiveOvertakeQueue } from './LiveOvertakeToast';
import { UserMenu } from '@/components/auth/UserMenu';
import { 
  initSessionTracking, 
  trackGameStartInSession,
  trackPageView 
} from '@/lib/analytics/session';
import { trackJourneyStep } from '@/lib/analytics/engagement';

export function GameScreen() {
  const { user, isLoading: identityLoading } = useIdentity();
  const { fid } = useAuth();
  // Use FID as the user identifier
  const userId = fid ? String(fid) : (user?.userId || '');
  
  // Track token display time for guess timing
  const [tokenDisplayTime, setTokenDisplayTime] = useState<number | null>(null);
  const gameStartTimeRef = useRef<number | null>(null);
  const lastGameEndTimeRef = useRef<number | null>(null);
  const sessionStartTimeRef = useRef<number | null>(null);
  
  // Debug logging
  console.log('[GameScreen] Rendering with:', { fid, userId, identityLoading });
  
  // Initialize session tracking
  useEffect(() => {
    if (userId && !sessionStartTimeRef.current) {
      sessionStartTimeRef.current = Date.now();
      initSessionTracking(userId);
      trackPageView('game');
      trackJourneyStep('landing_view', 0);
    }
  }, [userId]);
  
  const {
    gameState,
    isLoading,
    error,
    lossExplanation,
    makeGuess,
    continueAfterCorrect,
    playAgain,
    activateReprieve,
    milestoneMessage,
    completedRun,
    liveOvertakes,
    clearLiveOvertakes,
  } = useGame(userId);
  
  // Track token display time for guess timing analytics
  useEffect(() => {
    if (gameState.nextToken && gameState.phase === 'playing') {
      setTokenDisplayTime(Date.now());
    }
  }, [gameState.nextToken, gameState.phase]);

  // Track game start
  useEffect(() => {
    if (gameState.runId && gameState.phase === 'playing' && !gameStartTimeRef.current) {
      gameStartTimeRef.current = Date.now();
      const timeSinceLastGame = lastGameEndTimeRef.current 
        ? gameStartTimeRef.current - lastGameEndTimeRef.current 
        : undefined;
      
      trackGameStartInSession();
      if (sessionStartTimeRef.current) {
        trackJourneyStep('game_start', gameStartTimeRef.current ? Date.now() - sessionStartTimeRef.current : 0);
      }
    }
  }, [gameState.runId, gameState.phase]);

  // Track first guess
  useEffect(() => {
    if (gameState.streak === 1 && sessionStartTimeRef.current) {
      trackJourneyStep('first_guess', Date.now() - sessionStartTimeRef.current);
    }
  }, [gameState.streak]);

  // Track milestone streaks
  useEffect(() => {
    if (gameState.streak === 5 && sessionStartTimeRef.current) {
      trackJourneyStep('streak_5', Date.now() - sessionStartTimeRef.current, gameState.streak);
    }
    if (gameState.streak === 10 && sessionStartTimeRef.current) {
      trackJourneyStep('streak_10', Date.now() - sessionStartTimeRef.current, gameState.streak);
    }
  }, [gameState.streak]);

  // Track game loss
  useEffect(() => {
    if (gameState.phase === 'loss' && gameStartTimeRef.current) {
      lastGameEndTimeRef.current = Date.now();
      if (sessionStartTimeRef.current) {
        trackJourneyStep('loss', Date.now() - sessionStartTimeRef.current, gameState.streak);
      }
    }
  }, [gameState.phase, gameState.streak]);

  // Debug: Log game state changes
  useEffect(() => {
    console.log('[GameScreen] Game state:', {
      phase: gameState.phase,
      streak: gameState.streak,
      currentToken: gameState.currentToken?.symbol,
      nextToken: gameState.nextToken?.symbol,
      isLoading,
      error,
    });
  }, [gameState, isLoading, error]);

  // Timer management
  const handleTimerExpire = useCallback(() => {
    // Timer expired - trigger loss
    if (gameState.phase === 'playing' && gameState.nextToken) {
      // Make an incorrect guess to trigger loss
      // We'll guess the opposite of what would be correct
      const currentMcap = gameState.currentToken?.marketCap || 0;
      const nextMcap = gameState.nextToken?.marketCap || 0;
      const correctGuess = nextMcap >= currentMcap ? 'cap' : 'slap';
      const wrongGuess = correctGuess === 'cap' ? 'slap' : 'cap';
      makeGuess(wrongGuess);
    }
  }, [gameState.phase, gameState.currentToken, gameState.nextToken, makeGuess]);

  const timer = useGameTimer(gameState.streak, handleTimerExpire);

  // Start timer when game starts playing
  useEffect(() => {
    if (gameState.phase === 'playing' && !timer.isPaused && timer.isExpired) {
      timer.reset(gameState.streak);
      timer.start();
    }
  }, [gameState.phase, gameState.streak, timer]);

  // Pause timer during correct phase and loss phase
  useEffect(() => {
    if (gameState.phase === 'correct' || gameState.phase === 'loss') {
      timer.pause();
    } else if (gameState.phase === 'playing' && timer.isPaused && !timer.isExpired) {
      // Reset with new timer duration for streak
      timer.reset(gameState.streak);
      timer.start();
    }
  }, [gameState.phase, gameState.streak, timer]);

  // Start timer when game first loads
  useEffect(() => {
    if (gameState.currentToken && gameState.phase === 'playing' && timer.isPaused) {
      timer.start();
    }
  }, [gameState.currentToken, gameState.phase, timer]);

  // Handle continue after correct - reset and start timer
  const handleContinueAfterCorrect = useCallback(() => {
    timer.reset(gameState.streak);
    timer.start();
    continueAfterCorrect();
  }, [continueAfterCorrect, timer, gameState.streak]);

  // Handle reprieve completion - reset timer and resume game
  const handleReprieveComplete = useCallback(() => {
    activateReprieve().then(() => {
      // Timer will be reset and started by the useEffect when phase changes to 'playing'
      timer.reset(gameState.streak);
      timer.start();
    });
  }, [activateReprieve, timer, gameState.streak]);

  // Loading state
  if (identityLoading || (isLoading && !gameState.currentToken)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400">Loading game...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-6">
        <div className="text-center">
          <div className="text-4xl mb-4">😵</div>
          <p className="text-rose-400 font-bold">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-zinc-800 rounded-lg text-white"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Loss screen
  if (gameState.phase === 'loss' && completedRun) {
    return (
      <LossScreen
        run={completedRun}
        lossExplanation={lossExplanation}
        onPlayAgain={playAgain}
        onReprieveComplete={handleReprieveComplete}
      />
    );
  }

  // Correct overlay
  if (gameState.phase === 'correct') {
    return (
      <>
        <SplitScreenGame
          currentToken={gameState.currentToken}
          nextToken={gameState.nextToken}
          streak={gameState.streak}
          onGuess={makeGuess}
          isLoading={isLoading}
          showNextMarketCap={true}
          timer={timer}
        />
        <CorrectOverlay
          streak={gameState.streak}
          onComplete={handleContinueAfterCorrect}
          milestoneMessage={milestoneMessage}
        />
        {/* Live overtake notifications */}
        <LiveOvertakeQueue overtakes={liveOvertakes} onClear={clearLiveOvertakes} />
      </>
    );
  }

  // Main game - split screen
  return (
    <>
      <SplitScreenGame
        currentToken={gameState.currentToken}
        nextToken={gameState.nextToken}
        streak={gameState.streak}
        onGuess={makeGuess}
        isLoading={isLoading}
        showNextMarketCap={false}
        timer={timer}
      />
      {/* Live overtake notifications */}
      <LiveOvertakeQueue overtakes={liveOvertakes} onClear={clearLiveOvertakes} />
    </>
  );
}

interface SplitScreenGameProps {
  currentToken: Token | null;
  nextToken: Token | null;
  streak: number;
  onGuess: (guess: Guess) => void;
  isLoading: boolean;
  showNextMarketCap: boolean;
  timer: ReturnType<typeof useGameTimer>;
}

function SplitScreenGame({ 
  currentToken, 
  nextToken, 
  streak, 
  onGuess, 
  isLoading,
  showNextMarketCap,
  timer,
}: SplitScreenGameProps) {
  if (!currentToken || !nextToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col md:flex-row relative bg-zinc-950 overflow-hidden">
      {/* Left Panel - Known Token (exactly 50%) */}
      <div className="h-1/2 md:h-full md:w-1/2 relative">
        <TokenPanel
          token={currentToken}
          showMarketCap={true}
          side="left"
        />
      </div>

      {/* VS Badge - centered at the boundary */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-zinc-900 border-4 border-zinc-700 flex items-center justify-center shadow-2xl shadow-black/50">
          <span className="text-white font-black text-lg md:text-xl">VS</span>
        </div>
      </div>

      {/* Right Panel - Token to Guess (exactly 50%) */}
      <div className="h-1/2 md:h-full md:w-1/2 relative">
        <TokenPanel
          token={nextToken}
          showMarketCap={showNextMarketCap}
          side="right"
          onGuess={onGuess}
          isLoading={isLoading}
          compareToken={currentToken}
        />
      </div>

      {/* Timer - Centered at top */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
        <div className="bg-black/40 backdrop-blur-sm rounded-full p-1">
          <GameTimer
            timeRemaining={timer.timeRemaining}
            totalTime={timer.totalTime}
            percentRemaining={timer.percentRemaining}
            color={timer.color}
            isPulsing={timer.isPulsing}
            isPaused={timer.isPaused}
            tier={timer.config.tier}
          />
        </div>
      </div>

      {/* Top bar with streak and user menu */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
        {/* Left side: Streak counter */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
            <span className="text-amber-400 text-lg">🔥</span>
            <span className="text-white font-bold text-lg tabular-nums">{streak}</span>
          </div>
        </div>

        {/* Right side: User menu + Leaderboard */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* User menu (only shows when authenticated) */}
          <UserMenu className="hidden md:block" />
          
          {/* Leaderboard link */}
          <Link 
            href="/leaderboard" 
            className="bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5 text-white/60 hover:text-white text-sm font-medium transition-colors"
          >
            🏆
          </Link>
        </div>
      </div>
    </div>
  );
}

interface TokenPanelProps {
  token: Token;
  showMarketCap: boolean;
  side: 'left' | 'right';
  onGuess?: (guess: Guess) => void;
  isLoading?: boolean;
  compareToken?: Token;
}

function TokenPanel({ 
  token, 
  showMarketCap, 
  side, 
  onGuess, 
  isLoading,
  compareToken 
}: TokenPanelProps) {
  const isRight = side === 'right';

  return (
    <div 
      className={`
        absolute inset-0 flex flex-col items-center justify-center overflow-hidden px-4
        ${isRight ? 'bg-zinc-800' : 'bg-zinc-900'}
      `}
      role="region"
      aria-label={isRight ? 'Token to guess' : 'Known token'}
    >
      {/* Giant background logo - very prominent */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="relative w-[400px] h-[400px] md:w-[500px] md:h-[500px] opacity-[0.08]">
          <Image
            src={token.logoUrl}
            alt=""
            fill
            sizes="500px"
            priority={!isRight}
            className="object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://ui-avatars.com/api/?name=${token.symbol}&background=random&size=800`;
            }}
          />
        </div>
      </div>

      {/* Soft glow effect behind logo area */}
      <div className={`absolute inset-0 ${
        isRight 
          ? 'bg-[radial-gradient(circle_at_50%_40%,_rgba(100,100,120,0.15)_0%,_transparent_50%)]' 
          : 'bg-[radial-gradient(circle_at_50%_40%,_rgba(120,100,80,0.12)_0%,_transparent_50%)]'
      }`} />

      {/* Bottom gradient for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center gap-2">
        {/* Top panel (known): Large logo */}
        {!isRight && (
          <div className="relative w-20 h-20 md:w-24 md:h-24 mb-2">
            <Image
              src={token.logoUrl}
              alt={`${token.name} logo`}
              fill
              sizes="(max-width: 768px) 80px, 96px"
              priority
              className="object-contain drop-shadow-2xl"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://ui-avatars.com/api/?name=${token.symbol}&background=random&size=200`;
              }}
            />
          </div>
        )}

        {/* Bottom panel (guess): Inline logo with ticker */}
        {isRight && (
          <div className="flex items-center gap-3 mb-1">
            <div className="relative w-12 h-12 md:w-14 md:h-14">
              <Image
                src={token.logoUrl}
                alt={`${token.name} logo`}
                fill
                sizes="56px"
                priority
                className="object-contain drop-shadow-xl"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${token.symbol}&background=random&size=100`;
                }}
              />
            </div>
            <TokenInfoTooltip token={token}>
              <h2 className="text-3xl md:text-4xl font-black text-white cursor-pointer hover:text-amber-300 transition-colors tracking-tight flex items-center gap-2 drop-shadow-lg">
                {token.symbol}
                <span className="text-base opacity-50 hover:opacity-100 font-normal">ⓘ</span>
              </h2>
            </TokenInfoTooltip>
          </div>
        )}

        {/* Top panel: Token symbol - clickable for info */}
        {!isRight && (
          <TokenInfoTooltip token={token}>
            <h2 className="text-3xl md:text-5xl font-black text-white cursor-pointer hover:text-amber-300 transition-colors tracking-tight flex items-center gap-2 drop-shadow-lg">
              {token.symbol}
              <span className="text-lg md:text-xl opacity-50 hover:opacity-100 font-normal">ⓘ</span>
            </h2>
          </TokenInfoTooltip>
        )}
        
        {/* Token full name */}
        <p className="text-white/50 text-xs md:text-sm font-medium">{token.name}</p>

        {/* Divider */}
        <div className="w-12 h-0.5 bg-white/20 rounded-full my-1" />

        {/* Market cap label */}
        <p className="text-white/40 text-xs uppercase tracking-widest">Market Cap</p>

        {/* Market cap or question mark */}
        {showMarketCap ? (
          <div className="text-4xl md:text-5xl font-black text-amber-400 tabular-nums drop-shadow-lg">
            {formatMarketCap(token.marketCap)}
          </div>
        ) : (
          <div className="text-5xl md:text-6xl font-black text-amber-400/80 animate-pulse">
            ?
          </div>
        )}

        {/* Buttons for guess panel */}
        {isRight && onGuess ? (
          <div className="flex flex-col items-center gap-2 mt-3">
            {/* Higher button */}
            <button
              onClick={() => onGuess('cap')}
              disabled={isLoading}
              className="
                w-48 py-3 px-6 rounded-xl
                bg-emerald-500/20 hover:bg-emerald-500/30
                border-2 border-emerald-400/50 hover:border-emerald-400
                text-emerald-300 hover:text-emerald-200 font-bold text-base
                transition-all duration-200 transform hover:scale-105
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                flex items-center justify-center gap-2
                shadow-lg shadow-emerald-500/10
              "
            >
              <span className="text-xl">▲</span>
              Higher
            </button>

            {/* Lower button */}
            <button
              onClick={() => onGuess('slap')}
              disabled={isLoading}
              className="
                w-48 py-3 px-6 rounded-xl
                bg-rose-500/20 hover:bg-rose-500/30
                border-2 border-rose-400/50 hover:border-rose-400
                text-rose-300 hover:text-rose-200 font-bold text-base
                transition-all duration-200 transform hover:scale-105
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                flex items-center justify-center gap-2
                shadow-lg shadow-rose-500/10
              "
            >
              <span className="text-xl">▼</span>
              Lower
            </button>

            {/* Comparison text */}
            {compareToken && (
              <p className="text-white/50 text-xs mt-1">
                than <span className="text-white font-bold">{compareToken.symbol}</span>
              </p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
