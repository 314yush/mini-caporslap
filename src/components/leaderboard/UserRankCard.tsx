'use client';

interface UserRankCardProps {
  rank: number;
  score: number;
  rankChange?: number;
  direction?: 'up' | 'down' | null;
}

export function UserRankCard({ rank, score, rankChange, direction }: UserRankCardProps) {
  return (
    <div className="
      relative mb-4 p-4 rounded-xl
      bg-gradient-to-r from-purple-600/30 via-violet-600/30 to-blue-600/30
      border border-purple-500/30
      backdrop-blur-sm
      overflow-hidden
    ">
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-blue-500/20 to-purple-500/0 animate-pulse" />
      
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-white/90 font-medium text-sm">
            You Currently Rank
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-white font-bold text-2xl">
            #{rank}
          </div>
          {direction === 'up' && rankChange && (
            <div className="flex items-center gap-1 text-blue-400">
              <span className="text-sm">↑</span>
              <span className="text-xs font-semibold">{rankChange}</span>
            </div>
          )}
          {direction === 'down' && rankChange && (
            <div className="flex items-center gap-1 text-red-400">
              <span className="text-sm">↓</span>
              <span className="text-xs font-semibold">{rankChange}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="relative mt-2 text-blue-300 text-xs font-medium">
        Score: {score}
      </div>
    </div>
  );
}




