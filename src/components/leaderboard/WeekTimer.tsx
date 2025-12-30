'use client';

import { useState, useEffect } from 'react';
import { getTimeUntilNextWeek, formatCountdown, formatCountdownCompact } from '@/lib/leaderboard/week-timer';

export function WeekTimer() {
  const [timeLeft, setTimeLeft] = useState(getTimeUntilNextWeek());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeUntilNextWeek());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const compact = formatCountdownCompact(timeLeft);
  const [days, hours, minutes, seconds] = compact.split(':');

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-xs text-zinc-400 uppercase tracking-wider">
        Week Resets In
      </div>
      <div className="flex items-center gap-2 font-mono">
        {/* Days */}
        <div className="flex flex-col items-center">
          <div className="text-2xl font-bold text-white tabular-nums">
            {days}
          </div>
          <div className="text-xs text-zinc-400 uppercase">Days</div>
        </div>
        <div className="text-xl text-zinc-600">:</div>
        
        {/* Hours */}
        <div className="flex flex-col items-center">
          <div className="text-2xl font-bold text-white tabular-nums">
            {hours}
          </div>
          <div className="text-xs text-zinc-400 uppercase">Hours</div>
        </div>
        <div className="text-xl text-zinc-600">:</div>
        
        {/* Minutes */}
        <div className="flex flex-col items-center">
          <div className="text-2xl font-bold text-white tabular-nums">
            {minutes}
          </div>
          <div className="text-xs text-zinc-400 uppercase">Mins</div>
        </div>
        <div className="text-xl text-zinc-600">:</div>
        
        {/* Seconds */}
        <div className="flex flex-col items-center">
          <div className="text-2xl font-bold text-white tabular-nums">
            {seconds}
          </div>
          <div className="text-xs text-zinc-400 uppercase">Secs</div>
        </div>
      </div>
      <div className="text-xs text-zinc-500">
        {formatCountdown(timeLeft)}
      </div>
    </div>
  );
}

