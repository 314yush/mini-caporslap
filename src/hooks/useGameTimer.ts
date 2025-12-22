'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getTimerConfig, 
  getTimerDuration, 
  getTimerDurationAfterReprieve,
  getTimerColor,
  CORRECT_ANIMATION_PAUSE,
  TimerConfig
} from '@/lib/game-core/timer';

export interface UseGameTimerReturn {
  // Current state
  timeRemaining: number;
  totalTime: number;
  percentRemaining: number;
  color: 'green' | 'yellow' | 'red';
  isPulsing: boolean;
  isPaused: boolean;
  config: TimerConfig;
  
  // Controls
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: (streak: number, afterReprieve?: boolean) => void;
  
  // Events
  isExpired: boolean;
}

export function useGameTimer(
  initialStreak: number = 0,
  onExpire?: () => void
): UseGameTimerReturn {
  const [timeRemaining, setTimeRemaining] = useState<number>(() => 
    getTimerDuration(initialStreak)
  );
  const [totalTime, setTotalTime] = useState<number>(() => 
    getTimerDuration(initialStreak)
  );
  const [isPaused, setIsPaused] = useState(true); // Start paused
  const [isExpired, setIsExpired] = useState(false);
  const [config, setConfig] = useState<TimerConfig>(() => 
    getTimerConfig(initialStreak)
  );
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onExpireRef = useRef(onExpire);
  
  // Keep onExpire callback up to date
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);
  
  // Timer tick effect
  useEffect(() => {
    if (isPaused || isExpired) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    
    intervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 0.1; // Update every 100ms for smooth display
        
        if (newTime <= 0) {
          setIsExpired(true);
          setIsPaused(true);
          onExpireRef.current?.();
          return 0;
        }
        
        return newTime;
      });
    }, 100);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, isExpired]);
  
  // Calculate derived values
  const percentRemaining = totalTime > 0 ? timeRemaining / totalTime : 0;
  const color = getTimerColor(percentRemaining, config);
  const isPulsing = timeRemaining <= 5 && timeRemaining > 0 && !isPaused;
  
  // Control functions
  const start = useCallback(() => {
    setIsExpired(false);
    setIsPaused(false);
  }, []);
  
  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);
  
  const resume = useCallback(() => {
    if (!isExpired) {
      setIsPaused(false);
    }
  }, [isExpired]);
  
  const reset = useCallback((streak: number, afterReprieve: boolean = false) => {
    const newConfig = getTimerConfig(streak);
    const newDuration = afterReprieve 
      ? getTimerDurationAfterReprieve(streak)
      : getTimerDuration(streak);
    
    setConfig(newConfig);
    setTotalTime(newDuration);
    setTimeRemaining(newDuration);
    setIsExpired(false);
    setIsPaused(true); // Reset paused, will start when game continues
  }, []);
  
  return {
    timeRemaining,
    totalTime,
    percentRemaining,
    color,
    isPulsing,
    isPaused,
    config,
    start,
    pause,
    resume,
    reset,
    isExpired,
  };
}

/**
 * Hook to pause timer during correct animation
 */
export function useTimerPauseOnCorrect(
  isCorrectPhase: boolean,
  pause: () => void,
  resume: () => void
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (isCorrectPhase) {
      // Pause immediately
      pause();
      
      // Resume after animation
      timeoutRef.current = setTimeout(() => {
        resume();
      }, CORRECT_ANIMATION_PAUSE);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isCorrectPhase, pause, resume]);
}






