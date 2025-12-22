'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  LeaderboardList, 
  PrizePoolBanner, 
  SponsorAdCard, 
  TopThreePodium,
  UserRankCard 
} from '@/components/leaderboard';
import { LeaderboardEntry } from '@/lib/game-core/types';
import { useIdentity } from '@/hooks';
import { trackPageView } from '@/lib/analytics/session';
import { trackLeaderboardEngagement, trackJourneyStep } from '@/lib/analytics/engagement';

type LeaderboardType = 'weekly' | 'global';

export default function LeaderboardPage() {
  const { userId } = useIdentity();
  const [type, setType] = useState<LeaderboardType>('weekly');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [prizePool, setPrizePool] = useState<{
    prizeAmount: number;
    sponsor?: { companyName: string; tokenSymbol: string; logoUrl?: string };
    userPrizeEstimate?: number;
  } | null>(null);
  const [positionChange, setPositionChange] = useState<{
    changed: boolean;
    previousRank: number | null;
    currentRank: number | null;
    direction: 'up' | 'down' | null;
    rankChange: number;
  } | null>(null);
  const [userScore, setUserScore] = useState<number>(0);
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

    async function fetchPrizePool() {
      try {
        const params = new URLSearchParams();
        if (userId) params.set('userId', userId);
        
        const response = await fetch(`/api/prizepool?${params}`);
        const data = await response.json();
        
        if (data.success && data.prizePool) {
          setPrizePool({
            prizeAmount: data.prizePool.prizeAmount || 1000,
            sponsor: data.sponsor ? {
              companyName: data.sponsor.companyName,
              tokenSymbol: data.sponsor.tokenSymbol,
              logoUrl: data.sponsor.logoUrl,
            } : undefined,
            userPrizeEstimate: data.userPrizeEstimate,
          });
          setUserScore(data.userScore || 0);
        }
      } catch (error) {
        console.error('Failed to fetch prize pool:', error);
      }
    }

    async function fetchPositionChange() {
      if (!userId || type !== 'weekly') return;
      
      try {
        const response = await fetch('/api/leaderboard/position-change', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, board: 'weekly' }),
        });
        
        const data = await response.json();
        if (data.success) {
          setPositionChange(data);
        }
      } catch (error) {
        console.error('Failed to fetch position change:', error);
      }
    }

    fetchLeaderboard();
    if (type === 'weekly') {
      fetchPrizePool();
      fetchPositionChange();
    }
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
                  ? 'bg-violet-600 text-white' 
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
                  ? 'bg-violet-600 text-white' 
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
        {type === 'weekly' && prizePool && (
          <PrizePoolBanner
            prizeAmount={prizePool.prizeAmount}
            sponsor={prizePool.sponsor}
            userRank={userRank}
            userPrizeEstimate={prizePool.userPrizeEstimate}
          />
        )}
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {entries.length >= 3 && (
              <TopThreePodium 
                entries={entries.slice(0, 3)} 
                currentUserId={userId}
              />
            )}
            
            {/* Sponsored Ad Card - After Top 3 */}
            {type === 'weekly' && prizePool?.sponsor && (
              <SponsorAdCard
                sponsor={{
                  companyName: prizePool.sponsor.companyName,
                  tokenSymbol: prizePool.sponsor.tokenSymbol,
                  tokenName: prizePool.sponsor.tokenSymbol,
                  logoUrl: prizePool.sponsor.logoUrl,
                }}
                ctaText="Trade Now"
                ctaUrl={`https://${prizePool.sponsor.companyName.toLowerCase().replace(/\s+/g, '')}.com`}
              />
            )}
            
            {/* User Rank Card - If not in top 3 */}
            {userRank && userRank > 3 && (
              <UserRankCard
                rank={userRank}
                score={type === 'weekly' 
                  ? (entries.find(e => e.user.userId === userId)?.cumulativeScore || userScore || entries.find(e => e.user.userId === userId)?.bestStreak || 0)
                  : (entries.find(e => e.user.userId === userId)?.bestStreak || 0)
                }
                rankChange={positionChange?.rankChange}
                direction={positionChange?.direction || null}
              />
            )}
            
            {/* Rest of Leaderboard */}
            <LeaderboardList
              entries={entries}
              userRank={userRank}
              currentUserId={userId}
              showTopThree={true}
            />
          </>
        )}
      </main>

      {/* Play CTA */}
      <div className="sticky bottom-0 p-4 bg-zinc-950/90 backdrop-blur border-t border-zinc-800">
        <div className="max-w-lg mx-auto">
          <Link
            href="/"
            className="
              block w-full py-4 text-center rounded-2xl
              bg-gradient-to-br from-violet-500 via-purple-600 to-violet-500
              text-white font-bold text-lg
              shadow-lg shadow-violet-500/30
              hover:shadow-violet-500/50 hover:scale-[1.02]
              transition-all duration-200
              relative overflow-hidden
            "
          >
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
            <span className="relative z-10">Play Now</span>
          </Link>
          <p className="text-center text-violet-300/60 text-xs mt-2 font-medium">
            One more win changes everything.
          </p>
        </div>
      </div>
    </div>
  );
}


