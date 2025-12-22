import { NextRequest, NextResponse } from 'next/server';
import { getWeeklyLeaderboard, getGlobalLeaderboard, getUserWeeklyRank, getWeeklyCumulativeScores } from '@/lib/redis';
import { LeaderboardEntry } from '@/lib/game-core/types';

/**
 * GET /api/leaderboard
 * Returns leaderboard entries
 * Query params:
 *   - type: 'weekly' | 'global' (default: weekly)
 *   - limit: number (default: 100)
 *   - userId: string (optional, to get user's rank)
 * 
 * For weekly: Returns cumulative scores (sum of all streaks in the week)
 * For global: Returns best streaks (all-time best)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') || 'weekly') as 'weekly' | 'global';
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const userId = searchParams.get('userId');

    let entries: LeaderboardEntry[] = [];
    let userRank: number | null = null;

    if (type === 'weekly') {
      // For weekly, prefer cumulative scores (sum of all streaks in the week)
      // But fallback to regular weekly leaderboard if cumulative scores don't exist yet
      const cumulativeScores = await getWeeklyCumulativeScores(limit);
      
      if (cumulativeScores.length > 0) {
        // Use cumulative scores (new system)
        // Get weekly leaderboard entries for user info (avatars, names, etc.)
        const weeklyEntries = await getWeeklyLeaderboard(limit);
        const entryMap = new Map<string, LeaderboardEntry>();
        weeklyEntries.forEach(entry => {
          entryMap.set(entry.user.userId, entry);
        });
        
        // Combine cumulative scores with user info from weekly entries
        entries = await Promise.all(
          cumulativeScores.map(async (score, index) => {
            const userEntry = entryMap.get(score.userId);
            
            if (userEntry) {
              // Use existing entry but update with cumulative score
              return {
                ...userEntry,
                rank: index + 1,
                cumulativeScore: score.cumulativeScore,
                bestStreak: score.bestStreak, // Best single streak in the week
              };
            }
            
            // If no entry found, resolve identity and create entry
            const { resolveIdentity } = await import('@/lib/auth/identity-resolver');
            const identity = await resolveIdentity(score.userId);
            
            // Determine user type based on identity source and userId format
            let userType: 'farcaster' | 'wallet' | 'privy' | 'anon' = 'anon';
            if (identity.source === 'farcaster') {
              userType = 'farcaster';
            } else if (/^0x[a-fA-F0-9]{40}$/i.test(identity.address)) {
              userType = 'wallet';
            } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identity.address)) {
              userType = 'privy'; // Privy UUID
            }
            
            return {
              rank: index + 1,
              user: {
                userId: identity.address,
                userType,
                displayName: identity.displayName,
                avatarUrl: identity.avatarUrl,
              },
              bestStreak: score.bestStreak,
              cumulativeScore: score.cumulativeScore,
              usedReprieve: false,
              timestamp: Date.now(),
            };
          })
        );
        
        // Get user's rank in cumulative scores
        if (userId) {
          const userIndex = cumulativeScores.findIndex(s => s.userId === userId);
          userRank = userIndex >= 0 ? userIndex + 1 : null;
        }
      } else {
        // Fallback: Use regular weekly leaderboard (best streaks) if cumulative scores don't exist
        // This handles the transition period or if cumulative tracking isn't set up yet
        entries = await getWeeklyLeaderboard(limit);
        
        if (userId) {
          userRank = await getUserWeeklyRank(userId);
        }
      }
    } else {
      // For global, use best streaks (all-time best)
      entries = await getGlobalLeaderboard(limit);
      
      if (userId) {
        // For global, we need to find rank in global leaderboard
        const userIndex = entries.findIndex(e => e.user.userId === userId);
        userRank = userIndex >= 0 ? userIndex + 1 : null;
      }
    }

    return NextResponse.json({
      success: true,
      type,
      entries,
      userRank,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
