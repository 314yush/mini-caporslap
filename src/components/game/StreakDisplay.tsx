'use client';

import { getStreakTier } from '@/lib/game-core/streak';

interface StreakDisplayProps {
  streak: number;
  showLabel?: boolean;
}

export function StreakDisplay({ streak, showLabel = false }: StreakDisplayProps) {
  const tier = getStreakTier(streak);
  
  if (streak === 0) {
    return null;
  }

  const tierStyles = {
    0: 'text-zinc-400',
    1: 'text-amber-400',
    2: 'text-orange-400',
    3: 'text-rose-400 animate-pulse',
  };

  const fireEmojis = {
    0: '',
    1: '🔥',
    2: '🔥🔥',
    3: '🔥🔥🔥',
  };

  return (
    <div className={`flex items-center gap-2 ${tierStyles[tier]}`}>
      {fireEmojis[tier] && <span className="text-lg">{fireEmojis[tier]}</span>}
      <span className="font-bold text-2xl tabular-nums">{streak}</span>
      {showLabel && <span className="text-sm opacity-70">streak</span>}
    </div>
  );
}



