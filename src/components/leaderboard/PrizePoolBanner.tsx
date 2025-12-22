'use client';

import { useEffect, useState } from 'react';
import { FlipTimer } from './FlipTimer';

interface PrizePoolBannerProps {
  prizeAmount?: number;
  sponsor?: {
    companyName: string;
    tokenSymbol: string;
    logoUrl?: string;
  };
  userRank?: number | null;
  userPrizeEstimate?: number;
}

export function PrizePoolBanner({
  prizeAmount: _prizeAmount,
  sponsor: _sponsor,
  userRank: _userRank,
  userPrizeEstimate: _userPrizeEstimate,
}: PrizePoolBannerProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isPulsing, setIsPulsing] = useState(false);
  
  useEffect(() => {
    // Calculate time remaining until end of week (Sunday 11:59 PM UTC)
    // Optimized: Only recalculate when needed, use requestAnimationFrame for smoother updates
    const updateTimeRemaining = () => {
      const now = new Date();
      const currentDay = now.getUTCDay();
      const daysUntilSunday = currentDay === 0 ? 7 : 7 - currentDay;
      
      const nextSunday = new Date(now);
      nextSunday.setUTCDate(now.getUTCDate() + daysUntilSunday);
      nextSunday.setUTCHours(23, 59, 59, 999);
      
      const diff = nextSunday.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsPulsing(false);
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      // Only update state if values changed (prevents unnecessary re-renders)
      setTimeRemaining(prev => {
        if (prev.days !== days || prev.hours !== hours || prev.minutes !== minutes || prev.seconds !== seconds) {
          return { days, hours, minutes, seconds };
        }
        return prev;
      });
      
      // Pulse animation when less than 24 hours remaining
      setIsPulsing(prev => {
        const shouldPulse = days === 0 && hours < 24;
        return prev !== shouldPulse ? shouldPulse : prev;
      });
    };
    
    // Initial update
    updateTimeRemaining();
    
    // Use setInterval with 1000ms for second-by-second updates
    // This is more efficient than requestAnimationFrame for this use case
    const interval = setInterval(updateTimeRemaining, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="mb-4">
      {/* Optimized countdown timer - mobile responsive, compact design */}
      <div className={`
        relative p-3 rounded-lg
        bg-gradient-to-r from-violet-900/50 to-purple-800/50 border border-violet-700/50
        ${isPulsing ? 'animate-pulse border-amber-500/50' : ''}
        overflow-hidden
      `}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-lg animate-spin" style={{ animationDuration: '2s' }}>⏱️</span>
          <span className="text-violet-200/90 text-xs font-medium">Ends in:</span>
          {isPulsing && (
            <span className="text-xs text-amber-400 animate-pulse font-semibold">⚡</span>
          )}
        </div>
        
        <div className="flex justify-center overflow-x-auto">
          <FlipTimer
            days={timeRemaining.days}
            hours={timeRemaining.hours}
            minutes={timeRemaining.minutes}
            seconds={timeRemaining.seconds}
          />
        </div>
      </div>
    </div>
  );
}


