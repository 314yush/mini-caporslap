'use client';

import { useEffect, useState, useRef, useMemo } from 'react';

interface FlipTimerProps {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  className?: string;
}

interface DigitProps {
  value: number;
  label?: string;
  showColon?: boolean;
}

function SingleDigit({ 
  currentDigit, 
  nextDigit, 
  isAnimating 
}: { 
  currentDigit: number; 
  nextDigit: number;
  isAnimating: boolean;
}) {
  return (
    <div className="relative w-8 h-10 sm:w-10 sm:h-14 overflow-hidden rounded-md bg-violet-900/50 border border-violet-700/50 shadow-inner">
      {/* Current digit sliding out */}
      <div
        className={`
          absolute inset-0 flex items-center justify-center
          transition-transform ease-out
          ${isAnimating ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}
        `}
        style={{
          transitionDuration: '400ms',
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div className="text-xl sm:text-2xl font-bold text-violet-100 tabular-nums">
          {currentDigit}
        </div>
      </div>
      {/* Next digit sliding in */}
      <div
        className={`
          absolute inset-0 flex items-center justify-center translate-y-full
          transition-transform ease-out
          ${isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
        `}
        style={{
          transitionDuration: '400ms',
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div className="text-xl sm:text-2xl font-bold text-violet-100 tabular-nums">
          {nextDigit}
        </div>
      </div>
    </div>
  );
}

function Digit({ value, label, showColon = false }: DigitProps) {
  const [prevValue, setPrevValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const tensAnimating = Math.floor(value / 10) !== Math.floor(prevValue / 10);
  const onesAnimating = value % 10 !== prevValue % 10;

  useEffect(() => {
    // Clear any pending timeout
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    
    if (value !== prevValue) {
      setIsAnimating(true);
      animationTimeoutRef.current = setTimeout(() => {
        setPrevValue(value);
        setIsAnimating(false);
        animationTimeoutRef.current = null;
      }, 400);
    }
    
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="flex flex-col items-center gap-0.5 sm:gap-1">
      <div className="relative flex items-center gap-0.5 sm:gap-1">
        <SingleDigit 
          currentDigit={Math.floor(prevValue / 10)}
          nextDigit={Math.floor(value / 10)}
          isAnimating={tensAnimating && isAnimating}
        />
        <SingleDigit 
          currentDigit={prevValue % 10}
          nextDigit={value % 10}
          isAnimating={onesAnimating && isAnimating}
        />
        {showColon && (
          <div className="absolute -right-2 sm:-right-3 top-1/2 -translate-y-1/2 text-violet-400 text-lg sm:text-xl font-bold animate-pulse">
            :
          </div>
        )}
      </div>
      {label && (
        <div className="text-[10px] sm:text-xs text-violet-300/70 font-medium uppercase tracking-tight text-center px-0.5">
          {label}
        </div>
      )}
    </div>
  );
}

export function FlipTimer({ days, hours, minutes, seconds, className = '' }: FlipTimerProps) {
  // Memoize to prevent unnecessary re-renders when parent updates
  const timerValues = useMemo(() => ({
    days,
    hours,
    minutes,
    seconds,
  }), [days, hours, minutes, seconds]);

  return (
    <div className={`flex items-center justify-center gap-1 sm:gap-2 ${className}`}>
      {timerValues.days > 0 && (
        <Digit value={timerValues.days} label="DAYS" showColon />
      )}
      <Digit value={timerValues.hours} label="HOURS" showColon />
      <Digit value={timerValues.minutes} label="MINUTES" showColon />
      <Digit value={timerValues.seconds} label="SECONDS" />
    </div>
  );
}


