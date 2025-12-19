'use client';

import { LeaderboardEntry } from '@/lib/game-core/types';
import Image from 'next/image';

interface LeaderboardListProps {
  entries: LeaderboardEntry[];
  userRank?: number | null;
  currentUserId?: string;
}

export function LeaderboardList({ entries, userRank, currentUserId }: LeaderboardListProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🏆</div>
        <p className="text-zinc-400">No entries yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {entries.map((entry) => (
        <LeaderboardRow
          key={entry.user.userId}
          entry={entry}
          isCurrentUser={entry.user.userId === currentUserId}
        />
      ))}
      
      {/* Show user's rank if not in top list */}
      {userRank && userRank > entries.length && (
        <div className="mt-4 pt-4 border-t border-zinc-800">
          <p className="text-center text-zinc-400 text-sm mb-2">Your rank</p>
          <div className="px-4 py-3 rounded-xl bg-violet-900/20 border border-violet-700/50">
            <span className="text-violet-400 font-bold">#{userRank}</span>
          </div>
        </div>
      )}
    </div>
  );
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
}

function LeaderboardRow({ entry, isCurrentUser }: LeaderboardRowProps) {
  const getRankDisplay = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 50) return '👑';
    if (streak >= 20) return '🔥🔥🔥';
    if (streak >= 10) return '🔥🔥';
    if (streak >= 5) return '🔥';
    return '';
  };

  return (
    <div
      className={`
        flex items-center gap-4 px-4 py-3 rounded-xl
        ${isCurrentUser 
          ? 'bg-violet-900/20 border border-violet-700/50' 
          : 'bg-zinc-900/50 border border-zinc-800'
        }
      `}
    >
      {/* Rank */}
      <div className="w-10 text-center">
        <span className={`font-bold ${entry.rank <= 3 ? 'text-2xl' : 'text-zinc-400'}`}>
          {getRankDisplay(entry.rank)}
        </span>
      </div>

      {/* Avatar */}
      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-800">
        {entry.user.avatarUrl ? (
          <Image
            src={entry.user.avatarUrl}
            alt={entry.user.displayName}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-lg">
            {entry.user.displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${isCurrentUser ? 'text-violet-300' : 'text-white'}`}>
          {entry.user.displayName}
        </p>
        {entry.usedReprieve && (
          <span className="text-xs text-amber-500">🕯 used reprieve</span>
        )}
      </div>

      {/* Streak */}
      <div className="text-right">
        <span className="text-xl font-bold text-emerald-400 tabular-nums">
          {entry.bestStreak}
        </span>
        {getStreakEmoji(entry.bestStreak) && (
          <span className="ml-1">{getStreakEmoji(entry.bestStreak)}</span>
        )}
      </div>
    </div>
  );
}



