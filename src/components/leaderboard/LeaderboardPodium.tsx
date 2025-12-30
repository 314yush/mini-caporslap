'use client';

import { LeaderboardEntry } from '@/lib/game-core/types';
import Image from 'next/image';

interface LeaderboardPodiumProps {
  topThree: LeaderboardEntry[];
  type: 'weekly' | 'global';
}

export function LeaderboardPodium({ topThree, type }: LeaderboardPodiumProps) {
  if (topThree.length === 0) {
    return null;
  }

  // Ensure we have exactly 3 entries (pad with null if needed)
  const entries = [
    topThree[1] || null, // 2nd place (left)
    topThree[0] || null, // 1st place (center)
    topThree[2] || null, // 3rd place (right)
  ];

  const getDisplayValue = (entry: LeaderboardEntry | null) => {
    if (!entry) return 0;
    // For weekly: bestStreak contains the score
    // For global: bestStreak contains the streak
    return entry.bestStreak;
  };

  const getLabel = () => {
    return type === 'weekly' ? 'Points' : 'Streak';
  };

  return (
    <div className="relative w-full mb-8">
      {/* Podium base */}
      <div className="relative flex items-end justify-center gap-2 h-48">
        {/* 2nd Place (Left) */}
        <div className="flex-1 flex flex-col items-center">
          <div className="relative mb-2">
            {entries[0] ? (
              <div className="relative w-16 h-16 rounded-full overflow-hidden bg-zinc-800 border-2 border-zinc-700">
                {entries[0].user.avatarUrl ? (
                  <Image
                    src={entries[0].user.avatarUrl}
                    alt={entries[0].user.displayName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl text-white">
                    {entries[0].user.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-zinc-800/50 border-2 border-zinc-700/50" />
            )}
          </div>
          <div className="text-center mb-2">
            {entries[0] ? (
              <>
                <p className="text-sm font-medium text-white truncate max-w-[80px]">
                  {entries[0].user.displayName}
                </p>
                <div className="mt-1 px-2 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/50">
                  <span className="text-xs font-bold text-yellow-400 tabular-nums">
                    {getDisplayValue(entries[0])} {getLabel()}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-xs text-zinc-600">—</div>
            )}
          </div>
          {/* Podium step - medium height */}
          <div className="w-full bg-gradient-to-t from-blue-600 to-blue-500 rounded-t-lg border-2 border-blue-400 h-24 flex items-center justify-center">
            <span className="text-3xl font-black text-white">2</span>
          </div>
        </div>

        {/* 1st Place (Center) */}
        <div className="flex-1 flex flex-col items-center">
          <div className="relative mb-2">
            {entries[1] ? (
              <div className="relative w-20 h-20 rounded-full overflow-hidden bg-zinc-800 border-4 border-yellow-500 shadow-lg shadow-yellow-500/50">
                {entries[1].user.avatarUrl ? (
                  <Image
                    src={entries[1].user.avatarUrl}
                    alt={entries[1].user.displayName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl text-white">
                    {entries[1].user.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-zinc-800/50 border-4 border-yellow-500/50" />
            )}
          </div>
          <div className="text-center mb-2">
            {entries[1] ? (
              <>
                <p className="text-sm font-bold text-white truncate max-w-[100px]">
                  {entries[1].user.displayName}
                </p>
                <div className="mt-1 px-3 py-1.5 rounded-full bg-yellow-500/30 border-2 border-yellow-400">
                  <span className="text-sm font-black text-yellow-300 tabular-nums">
                    {getDisplayValue(entries[1])} {getLabel()}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-xs text-zinc-600">—</div>
            )}
          </div>
          {/* Podium step - tallest */}
          <div className="w-full bg-gradient-to-t from-blue-600 to-blue-500 rounded-t-lg border-2 border-blue-400 h-32 flex items-center justify-center">
            <span className="text-4xl font-black text-white">1</span>
          </div>
        </div>

        {/* 3rd Place (Right) */}
        <div className="flex-1 flex flex-col items-center">
          <div className="relative mb-2">
            {entries[2] ? (
              <div className="relative w-16 h-16 rounded-full overflow-hidden bg-zinc-800 border-2 border-zinc-700">
                {entries[2].user.avatarUrl ? (
                  <Image
                    src={entries[2].user.avatarUrl}
                    alt={entries[2].user.displayName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl text-white">
                    {entries[2].user.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-zinc-800/50 border-2 border-zinc-700/50" />
            )}
          </div>
          <div className="text-center mb-2">
            {entries[2] ? (
              <>
                <p className="text-sm font-medium text-white truncate max-w-[80px]">
                  {entries[2].user.displayName}
                </p>
                <div className="mt-1 px-2 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/50">
                  <span className="text-xs font-bold text-yellow-400 tabular-nums">
                    {getDisplayValue(entries[2])} {getLabel()}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-xs text-zinc-600">—</div>
            )}
          </div>
          {/* Podium step - shortest */}
          <div className="w-full bg-gradient-to-t from-blue-600 to-blue-500 rounded-t-lg border-2 border-blue-400 h-16 flex items-center justify-center">
            <span className="text-2xl font-black text-white">3</span>
          </div>
        </div>
      </div>
    </div>
  );
}

