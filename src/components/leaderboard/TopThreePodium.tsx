'use client';

import Image from 'next/image';
import { LeaderboardEntry } from '@/lib/game-core/types';

interface TopThreePodiumProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

export function TopThreePodium({ entries, currentUserId }: TopThreePodiumProps) {
  if (entries.length < 3) {
    return null;
  }

  const [first, second, third] = entries.slice(0, 3);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '👑';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  const getRankGradient = (rank: number) => {
    if (rank === 1) return 'from-yellow-500/20 via-amber-500/20 to-yellow-600/20 border-yellow-500/50';
    if (rank === 2) return 'from-blue-500/20 via-cyan-500/20 to-blue-600/20 border-blue-500/50';
    if (rank === 3) return 'from-purple-500/20 via-pink-500/20 to-purple-600/20 border-purple-500/50';
    return '';
  };

  const getRankGlow = (rank: number) => {
    if (rank === 1) return 'shadow-[0_0_30px_rgba(234,179,8,0.5)]';
    if (rank === 2) return 'shadow-[0_0_20px_rgba(59,130,246,0.4)]';
    if (rank === 3) return 'shadow-[0_0_20px_rgba(168,85,247,0.4)]';
    return '';
  };

  return (
    <div className="relative mb-6">
      {/* Decorative background elements */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-0 right-1/4 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative flex items-end justify-center gap-3 px-4">
        {/* 2nd Place (Left) */}
        <div className="flex-1 flex flex-col items-center max-w-[100px]">
          <div className={`relative w-20 h-20 rounded-full mb-2 bg-gradient-to-br ${getRankGradient(2)} border-2 ${getRankGlow(2)} overflow-hidden`}>
            {second.user.avatarUrl ? (
              <Image
                src={second.user.avatarUrl}
                alt={second.user.displayName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white">
                {second.user.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-zinc-900">
              2
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs font-semibold text-white truncate w-full">
              {second.user.displayName}
            </div>
            <div className="text-blue-300 font-bold text-sm mt-1">
              {second.cumulativeScore !== undefined ? second.cumulativeScore : second.bestStreak}
            </div>
          </div>
        </div>

        {/* 1st Place (Center - Elevated) */}
        <div className="flex flex-col items-center max-w-[120px] -mt-4">
          <div className="text-3xl mb-1">👑</div>
          <div className={`relative w-24 h-24 rounded-full mb-2 bg-gradient-to-br ${getRankGradient(1)} border-2 ${getRankGlow(1)} overflow-hidden`}>
            {first.user.avatarUrl ? (
              <Image
                src={first.user.avatarUrl}
                alt={first.user.displayName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white">
                {first.user.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-7 h-7 bg-yellow-500 rounded-full flex items-center justify-center text-sm font-bold text-zinc-900 border-2 border-zinc-900">
              1
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-white truncate w-full">
              {first.user.displayName}
            </div>
            <div className="text-yellow-300 font-bold text-base mt-1">
              {first.cumulativeScore !== undefined ? first.cumulativeScore : first.bestStreak}
            </div>
          </div>
        </div>

        {/* 3rd Place (Right) */}
        <div className="flex-1 flex flex-col items-center max-w-[100px]">
          <div className={`relative w-20 h-20 rounded-full mb-2 bg-gradient-to-br ${getRankGradient(3)} border-2 ${getRankGlow(3)} overflow-hidden`}>
            {third.user.avatarUrl ? (
              <Image
                src={third.user.avatarUrl}
                alt={third.user.displayName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white">
                {third.user.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute -top-1 -left-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-zinc-900">
              3
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs font-semibold text-white truncate w-full">
              {third.user.displayName}
            </div>
            <div className="text-purple-300 font-bold text-sm mt-1">
              {third.cumulativeScore !== undefined ? third.cumulativeScore : third.bestStreak}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


