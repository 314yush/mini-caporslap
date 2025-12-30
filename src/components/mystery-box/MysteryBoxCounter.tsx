'use client';

import { useState, useEffect } from 'react';
import { getClientFeatureFlags } from '@/lib/feature-flags';

interface PoolResponse {
  success: boolean;
  count: number;
  error?: string;
}

export function MysteryBoxCounter() {
  const [poolCount, setPoolCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPoolCount = async () => {
    try {
      const response = await fetch('/api/mystery-box/pool');
      const data: PoolResponse = await response.json();
      
      if (data.success) {
        setPoolCount(data.count);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch pool count');
      }
    } catch (err) {
      console.error('[MysteryBoxCounter] Error fetching pool count:', err);
      setError('Failed to fetch pool count');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on mount and every 30 seconds
  useEffect(() => {
    const flags = getClientFeatureFlags();
    const mysteryBoxEnabled = flags.mysteryBox;
    if (!mysteryBoxEnabled) {
      // Defer setState to avoid synchronous setState in effect
      Promise.resolve().then(() => {
        setIsLoading(false);
      });
      return;
    }

    fetchPoolCount();

    const interval = setInterval(() => {
      fetchPoolCount();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Don't render if feature is disabled
  const flags = getClientFeatureFlags();
  if (!flags.mysteryBox) {
    return null;
  }

  // Don't render if loading and no data yet
  if (isLoading && poolCount === null) {
    return null;
  }

  // Show error state (optional - could hide or show error icon)
  if (error) {
    return null; // Silently fail - don't show error to user
  }

  // Don't show if count is 0 or null
  if (poolCount === null || poolCount === 0) {
    return null;
  }

  return (
    <div className="group relative">
      <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
        <span className="text-amber-400 text-lg">🎁</span>
        <span className="text-white font-bold text-lg tabular-nums">
          {poolCount}
        </span>
      </div>
      
      {/* Tooltip on hover - positioned to avoid cutoff */}
      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block pointer-events-none z-[100] max-w-[280px] sm:max-w-[320px]">
        <div className="bg-zinc-900 text-white text-xs rounded-lg px-4 py-3 shadow-2xl border border-zinc-700">
          <p className="font-bold mb-2 text-amber-400">🎁 Mystery Boxes</p>
          <p className="text-zinc-300 mb-2">
            {poolCount} {poolCount === 1 ? 'box' : 'boxes'} remaining today
          </p>
          
          <div className="border-t border-zinc-700 pt-2 mt-2 space-y-1.5">
            <p className="font-semibold text-zinc-200 text-[11px] mb-1.5">How it works:</p>
            <ul className="text-zinc-400 text-[11px] space-y-1 list-disc list-inside">
              <li>Scratch to reveal crypto rewards</li>
              <li>Available after losing with streak 5+</li>
              <li>Max 2 boxes per day</li>
              <li>Must play 3+ games to unlock</li>
            </ul>
          </div>
        </div>
        {/* Arrow pointing down */}
        <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-900" />
      </div>
    </div>
  );
}

