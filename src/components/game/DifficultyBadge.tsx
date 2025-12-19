'use client';

import { getDifficultyInfo } from '@/lib/game-core/difficulty';

interface DifficultyBadgeProps {
  streak: number;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Displays the current difficulty tier based on streak
 */
export function DifficultyBadge({ 
  streak, 
  showProgress = false,
  size = 'md' 
}: DifficultyBadgeProps) {
  const { name, color, nextTierAt } = getDifficultyInfo(streak);
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };
  
  const bgColors: Record<string, string> = {
    'Easy': 'bg-emerald-500/20 border-emerald-500/30',
    'Medium': 'bg-blue-500/20 border-blue-500/30',
    'Hard': 'bg-amber-500/20 border-amber-500/30',
    'Expert': 'bg-orange-500/20 border-orange-500/30',
    'Insane': 'bg-rose-500/20 border-rose-500/30',
  };
  
  return (
    <div className="flex items-center gap-2">
      <span 
        className={`
          ${sizeClasses[size]}
          ${bgColors[name]}
          ${color}
          font-semibold rounded-full border
          transition-all duration-300
        `}
      >
        {name}
      </span>
      
      {showProgress && nextTierAt && (
        <span className="text-xs text-zinc-500">
          {nextTierAt - streak} to {name === 'Easy' ? 'Medium' : 
            name === 'Medium' ? 'Hard' : 
            name === 'Hard' ? 'Expert' : 'Insane'}
        </span>
      )}
    </div>
  );
}

/**
 * Compact difficulty indicator (just icon/color)
 */
export function DifficultyIndicator({ streak }: { streak: number }) {
  const { name, color } = getDifficultyInfo(streak);
  
  const icons: Record<string, string> = {
    'Easy': '🟢',
    'Medium': '🔵',
    'Hard': '🟡',
    'Expert': '🟠',
    'Insane': '🔴',
  };
  
  return (
    <span className={`${color} text-sm`} title={`Difficulty: ${name}`}>
      {icons[name]}
    </span>
  );
}

/**
 * Full difficulty display with tier name and progress
 */
export function DifficultyDisplay({ streak }: { streak: number }) {
  const { name, color, nextTierAt } = getDifficultyInfo(streak);
  
  const progressToNext = nextTierAt 
    ? ((streak - (nextTierAt - 5)) / 5) * 100 
    : 100;
  
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${color}`}>
          {name}
        </span>
        {nextTierAt && (
          <span className="text-xs text-zinc-500">
            {nextTierAt - streak} to next
          </span>
        )}
      </div>
      
      {nextTierAt && (
        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${
              name === 'Easy' ? 'bg-emerald-500' :
              name === 'Medium' ? 'bg-blue-500' :
              name === 'Hard' ? 'bg-amber-500' :
              name === 'Expert' ? 'bg-orange-500' :
              'bg-rose-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, progressToNext))}%` }}
          />
        </div>
      )}
    </div>
  );
}


