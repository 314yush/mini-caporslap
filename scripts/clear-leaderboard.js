/**
 * Script to clear and rebuild leaderboard
 * Usage: node scripts/clear-leaderboard.js [options]
 * 
 * Options:
 *   --all         Clear everything (leaderboards, profiles, streaks, ranks)
 *   --global      Clear only global leaderboard
 *   --weekly      Clear only weekly leaderboard
 *   --profiles    Clear only user profiles
 *   --confirm     Required safety confirmation
 */

const { createClient } = require('@redis/client');

const REDIS_URL = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL || 'redis://localhost:6379';

function getWeekKey() {
  const now = new Date();
  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-${week.toString().padStart(2, '0')}`;
}

async function clearLeaderboard() {
  const args = process.argv.slice(2);
  const clearAll = args.includes('--all');
  const clearGlobal = args.includes('--global');
  const clearWeekly = args.includes('--weekly');
  const clearProfiles = args.includes('--profiles');
  const confirmed = args.includes('--confirm');

  if (!confirmed) {
    console.error(`
⚠️  WARNING: This will delete leaderboard data!

Usage: node scripts/clear-leaderboard.js [options] --confirm

Options:
  --all         Clear everything (leaderboards, profiles, streaks, ranks)
  --global      Clear only global leaderboard
  --weekly      Clear only weekly leaderboard
  --profiles    Clear only user profiles
  --confirm     Required safety confirmation

Examples:
  node scripts/clear-leaderboard.js --all --confirm
  node scripts/clear-leaderboard.js --global --weekly --confirm
    `);
    process.exit(1);
  }

  if (!clearAll && !clearGlobal && !clearWeekly && !clearProfiles) {
    console.error('Please specify what to clear: --all, --global, --weekly, or --profiles');
    process.exit(1);
  }

  let client;
  try {
    // Parse Redis URL
    if (REDIS_URL.startsWith('redis://') || REDIS_URL.startsWith('rediss://')) {
      client = createClient({ url: REDIS_URL });
    } else {
      console.error('This script requires a direct Redis connection (redis://), not REST API');
      console.error('Use the API endpoint /api/admin/clear-leaderboard?confirm=true instead');
      process.exit(1);
    }

    await client.connect();
    console.log('Connected to Redis\n');

    const deleted = {};

    if (clearAll || clearGlobal) {
      // Clear global leaderboard
      const globalKey = 'leaderboard:global';
      const count = await client.zCard(globalKey);
      if (count > 0) {
        await client.del(globalKey);
        deleted.globalLeaderboard = count;
        console.log(`✓ Cleared global leaderboard (${count} entries)`);
      } else {
        console.log('ℹ Global leaderboard already empty');
      }
    }

    if (clearAll || clearWeekly) {
      // Clear weekly leaderboard
      const weekKey = getWeekKey();
      const weeklyKey = `leaderboard:weekly:${weekKey}`;
      const count = await client.zCard(weeklyKey);
      if (count > 0) {
        await client.del(weeklyKey);
        deleted.weeklyLeaderboard = count;
        console.log(`✓ Cleared weekly leaderboard (${count} entries)`);
      } else {
        console.log('ℹ Weekly leaderboard already empty');
      }

      // Clear weekly cumulative scores
      const cumulativeKey = `scores:weekly:${weekKey}:cumulative`;
      const cumulativeCount = await client.zCard(cumulativeKey);
      if (cumulativeCount > 0) {
        await client.del(cumulativeKey);
        deleted.weeklyCumulativeScores = cumulativeCount;
        console.log(`✓ Cleared weekly cumulative scores (${cumulativeCount} entries)`);
      }
    }

    if (clearAll || clearProfiles) {
      // Get all user IDs from leaderboards
      const userIds = new Set();

      if (clearAll || clearGlobal) {
        try {
          const entries = await client.zRange('leaderboard:global', 0, -1, { REV: true });
          for (const entry of entries) {
            try {
              const parsed = JSON.parse(entry);
              if (parsed.userId) userIds.add(parsed.userId);
            } catch {
              if (entry && !entry.startsWith('{')) userIds.add(entry);
            }
          }
        } catch (err) {
          // Leaderboard might already be cleared
        }
      }

      if (clearAll || clearWeekly) {
        try {
          const weekKey = getWeekKey();
          const weeklyKey = `leaderboard:weekly:${weekKey}`;
          const entries = await client.zRange(weeklyKey, 0, -1, { REV: true });
          for (const entry of entries) {
            try {
              const parsed = JSON.parse(entry);
              if (parsed.userId) userIds.add(parsed.userId);
            } catch {
              if (entry && !entry.startsWith('{')) userIds.add(entry);
            }
          }
        } catch (err) {
          // Leaderboard might already be cleared
        }
      }

      // Delete profiles, best streaks, and ranks
      let profilesDeleted = 0;
      let bestStreaksDeleted = 0;
      let ranksDeleted = 0;

      for (const userId of userIds) {
        const profileKey = `user:${userId}:profile`;
        const bestKey = `user:${userId}:best`;
        const rankGlobalKey = `user:${userId}:rank:global`;
        const rankWeeklyKey = `user:${userId}:rank:weekly`;

        const results = await Promise.all([
          client.del(profileKey),
          client.del(bestKey),
          client.del(rankGlobalKey),
          client.del(rankWeeklyKey),
        ]);

        if (results[0]) profilesDeleted++;
        if (results[1]) bestStreaksDeleted++;
        if (results[2] || results[3]) ranksDeleted++;
      }

      deleted.userProfiles = profilesDeleted;
      deleted.userBestStreaks = bestStreaksDeleted;
      deleted.userRanks = ranksDeleted;

      console.log(`✓ Cleared ${profilesDeleted} user profiles`);
      console.log(`✓ Cleared ${bestStreaksDeleted} user best streaks`);
      console.log(`✓ Cleared ${ranksDeleted} user ranks`);
    }

    await client.quit();
    
    console.log('\n✅ Leaderboard cleared successfully!');
    console.log('\nSummary:');
    console.log(JSON.stringify(deleted, null, 2));
    console.log('\nNote: Users will need to play again to appear on the leaderboard.');
    console.log('Their new scores will use wallet addresses (if available) instead of Privy UUIDs.');
  } catch (error) {
    console.error('Error:', error);
    if (client) {
      await client.quit().catch(() => {});
    }
    process.exit(1);
  }
}

clearLeaderboard();

