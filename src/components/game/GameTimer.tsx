'use client';

import { formatTimer } from '@/lib/game-core/timer';

interface GameTimerProps {
  timeRemaining: number;
  totalTime: number;
  percentRemaining: number;
  color: 'green' | 'yellow' | 'red';
  isPulsing: boolean;
  isPaused: boolean;
  tier?: string;
}

export function GameTimer({
  timeRemaining,
  totalTime: _totalTime,
  percentRemaining,
  color,
  isPulsing,
  isPaused,
  tier: _tier,
}: GameTimerProps) {
  // Calculate circle properties
  const size = 60;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference * (1 - percentRemaining);
  
  // Color classes
  const colorClasses = {
    green: {
      stroke: 'stroke-emerald-400',
      text: 'text-emerald-400',
      glow: 'shadow-emerald-400/20',
    },
    yellow: {
      stroke: 'stroke-amber-400',
      text: 'text-amber-400',
      glow: 'shadow-amber-400/30',
    },
    red: {
      stroke: 'stroke-rose-400',
      text: 'text-rose-400',
      glow: 'shadow-rose-400/40',
    },
  };
  
  const colors = colorClasses[color];
  
  return (
    <div 
      className={`
        relative flex items-center justify-center
        ${isPulsing ? 'animate-pulse' : ''}
      `}
    >
      {/* SVG Circle */}
      <svg
        width={size}
        height={size}
        className={`transform -rotate-90 ${isPulsing ? 'animate-pulse' : ''}`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-zinc-800"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={`${colors.stroke} transition-all duration-100`}
          style={{
            filter: isPulsing ? `drop-shadow(0 0 8px currentColor)` : undefined,
          }}
        />
      </svg>
      
      {/* Time display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span 
          className={`
            text-lg font-bold tabular-nums
            ${colors.text}
            ${isPulsing ? 'animate-pulse' : ''}
          `}
        >
          {formatTimer(timeRemaining)}
        </span>
      </div>
      
      {/* Paused indicator */}
      {isPaused && timeRemaining > 0 && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
          <span className="text-[8px] text-zinc-500 uppercase tracking-wider">
            paused
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Compact timer for inline display
 */
export function CompactTimer({
  timeRemaining,
  color,
  isPulsing,
}: {
  timeRemaining: number;
  color: 'green' | 'yellow' | 'red';
  isPulsing: boolean;
}) {
  const colorClasses = {
    green: 'text-emerald-400',
    yellow: 'text-amber-400',
    red: 'text-rose-400',
  };
  
  return (
    <span 
      className={`
        font-bold tabular-nums
        ${colorClasses[color]}
        ${isPulsing ? 'animate-pulse' : ''}
      `}
    >
      ⏱ {formatTimer(timeRemaining)}
    </span>
  );
}

/**
 * Timer with tier badge
 */
export function TimerWithTier({
  timeRemaining,
  totalTime,
  percentRemaining,
  color,
  isPulsing,
  isPaused,
  tier,
}: GameTimerProps) {
  return (
    <div className="flex items-center gap-3">
      <GameTimer
        timeRemaining={timeRemaining}
        totalTime={totalTime}
        percentRemaining={percentRemaining}
        color={color}
        isPulsing={isPulsing}
        isPaused={isPaused}
      />
      {tier && (
        <div className="flex flex-col">
          <span className="text-xs text-zinc-500 uppercase tracking-wider">
            Difficulty
          </span>
          <span className="text-sm font-bold text-white">
            {tier}
          </span>
        </div>
      )}
    </div>
  );
}

