'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { LeaderboardList } from '@/components/leaderboard';
import { LeaderboardEntry } from '@/lib/game-core/types';
import { useIdentity } from '@/hooks';
import { trackPageView, trackLeaderboardEngagement, trackJourneyStep } from '@/lib/analytics';

type LeaderboardType = 'weekly' | 'global';

export default function LeaderboardPage() {
  const { userId } = useIdentity();
  const [type, setType] = useState<LeaderboardType>('weekly');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pageStartTime = useRef<number>(Date.now());
  
  // Track page view and journey step
  useEffect(() => {
    trackPageView('leaderboard');
    trackJourneyStep('leaderboard_view', 0);
    
    return () => {
      const timeOnPage = Date.now() - pageStartTime.current;
      trackLeaderboardEngagement('view', timeOnPage, userRank || undefined);
    };
  }, [userRank]);

  useEffect(() => {
    async function fetchLeaderboard() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          type,
          limit: '50',
          ...(userId && { userId }),
        });
        
        const response = await fetch(`/api/leaderboard?${params}`);
        const data = await response.json();
        
        if (data.success) {
          setEntries(data.entries);
          setUserRank(data.userRank);
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLeaderboard();
  }, [type, userId]);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur border-b border-zinc-800">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              ← Back
            </Link>
            <h1 className="text-xl font-bold text-white">🏆 Leaderboard</h1>
            <div className="w-12" /> {/* Spacer */}
          </div>

          {/* Type tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => {
                setType('weekly');
                trackLeaderboardEngagement('filter', Date.now() - pageStartTime.current);
              }}
              className={`
                flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors
                ${type === 'weekly' 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }
              `}
            >
              This Week
            </button>
            <button
              onClick={() => {
                setType('global');
                trackLeaderboardEngagement('filter', Date.now() - pageStartTime.current);
              }}
              className={`
                flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors
                ${type === 'global' 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }
              `}
            >
              All Time
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <LeaderboardList
            entries={entries}
            userRank={userRank}
            currentUserId={userId}
          />
        )}
      </main>

      {/* Play CTA */}
      <div className="sticky bottom-0 p-4 bg-zinc-950/90 backdrop-blur border-t border-zinc-800">
        <div className="max-w-lg mx-auto">
          <Link
            href="/"
            className="
              block w-full py-4 text-center rounded-2xl
              bg-gradient-to-br from-emerald-500 to-emerald-600
              text-white font-bold text-lg
              shadow-lg shadow-emerald-500/25
              hover:shadow-emerald-500/40 transition-shadow
            "
          >
            Play Now
          </Link>
        </div>
      </div>
    </div>
  );
}


