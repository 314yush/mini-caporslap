'use client';

import { LeaderboardEntry } from '@/lib/game-core/types';
import Image from 'next/image';

interface LeaderboardListProps {
  entries: LeaderboardEntry[];
  userRank?: number | null;
  currentUserId?: string;
  showTopThree?: boolean;
}

export function LeaderboardList({ 
  entries, 
  userRank, 
  currentUserId,
  showTopThree = true 
}: LeaderboardListProps) {
  // Filter out guest/anonymous entries on client side as backup
  const filteredEntries = entries.filter((entry) => {
    const userId = entry.user.userId;
    const userType = entry.user.userType;
    const displayName = entry.user.displayName;
    
    // Skip guest users
    if (userId.startsWith('guest_') || userType === 'anon') {
      return false;
    }
    
    // Skip if displayName is "Guest" or looks like a full address
    if (displayName === 'Guest' || (displayName.length === 42 && displayName.startsWith('0x') && !displayName.includes('...'))) {
      return false;
    }
    
    return true;
  });

  if (filteredEntries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🏆</div>
        <p className="text-zinc-400">No entries yet. Be the first!</p>
      </div>
    );
  }

  // Separate top 3 from the rest
  const topThree = showTopThree ? filteredEntries.slice(0, 3) : [];
  const restOfEntries = showTopThree ? filteredEntries.slice(3) : filteredEntries;

  return (
    <div className="flex flex-col">
      {/* Top 3 will be rendered separately by parent */}
      {/* Rest of entries */}
      <div className="flex flex-col gap-2">
        {restOfEntries.map((entry) => (
          <LeaderboardRow
            key={entry.user.userId}
            entry={entry}
            isCurrentUser={entry.user.userId === currentUserId}
          />
        ))}
      </div>
    </div>
  );
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
}

function LeaderboardRow({ entry, isCurrentUser }: LeaderboardRowProps) {
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
        flex items-center gap-3 px-4 py-3 rounded-xl
        transition-all duration-200
        ${isCurrentUser 
          ? 'bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-700/50 shadow-lg shadow-blue-500/10' 
          : 'bg-zinc-900/40 border border-zinc-800/50 hover:bg-zinc-800/50'
        }
      `}
    >
      {/* Rank Badge */}
      <div className="w-12 text-center shrink-0">
        <div className={`
          inline-flex items-center justify-center w-10 h-10 rounded-full
          ${entry.rank <= 10 
            ? 'bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/50' 
            : 'bg-zinc-800/50 border border-zinc-700/50'
          }
        `}>
          <span className={`font-bold text-sm ${entry.rank <= 10 ? 'text-violet-300' : 'text-zinc-400'}`}>
            #{entry.rank}
          </span>
        </div>
      </div>

      {/* Avatar */}
      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-800 border-2 border-zinc-700 shrink-0">
        {entry.user.avatarUrl ? (
          <Image
            src={entry.user.avatarUrl}
            alt={entry.user.displayName}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-lg font-bold text-white">
            {entry.user.displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Name and Info */}
      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${isCurrentUser ? 'text-blue-200' : 'text-white'}`}>
          {entry.user.displayName}
        </p>
        {entry.usedReprieve && (
          <span className="text-xs text-amber-500">🕯 used reprieve</span>
        )}
      </div>

      {/* Score */}
      <div className="text-right shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-bold text-white tabular-nums">
            {entry.cumulativeScore !== undefined ? entry.cumulativeScore : entry.bestStreak}
          </span>
        </div>
        {getStreakEmoji(entry.bestStreak) && (
          <div className="text-xs mt-0.5 text-amber-400">
            {getStreakEmoji(entry.bestStreak)}
          </div>
        )}
      </div>
    </div>
  );
}






