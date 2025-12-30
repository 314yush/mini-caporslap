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
      
      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block pointer-events-none z-50">
        <div className="bg-zinc-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-zinc-700 whitespace-nowrap">
          <p className="font-semibold mb-1">Mystery Boxes</p>
          <p className="text-zinc-400">
            {poolCount} {poolCount === 1 ? 'box' : 'boxes'} remaining today
          </p>
        </div>
        {/* Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-900" />
      </div>
    </div>
  );
}

