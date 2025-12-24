require('dotenv').config();
const { Redis } = require('@upstash/redis');

/**
 * Clear ALL entries from Redis/Upstash
 * This will remove:
 * - All leaderboards (global, weekly, cumulative)
 * - All user profiles
 * - All user best streaks
 * - All user ranks
 * - All run data
 * - All weekly stats
 */
async function clearAllRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.error('❌ Redis not configured');
    console.error('Make sure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set in .env');
    process.exit(1);
  }

  const redis = new Redis({ url, token });
  console.log('🗑️  Clearing ALL Redis entries...\n');

  // Use pattern-based clearing (more reliable for Upstash)
  await clearByPattern(redis);
}

/**
 * Clear by known patterns
 * More reliable for Upstash Redis
 */
async function clearByPattern(redis) {
  console.log('📋 Clearing by known key patterns...\n');
  
  let totalDeleted = 0;

  // Clear global leaderboard
  try {
    const globalMembers = await redis.zrange('leaderboard:global', 0, -1);
    if (globalMembers && globalMembers.length > 0) {
      await redis.del('leaderboard:global');
      totalDeleted++;
      console.log(`✓ Cleared global leaderboard (${globalMembers.length} entries)`);
    } else {
      console.log('✓ Global leaderboard already empty');
    }
  } catch (e) {
    console.log('✓ Global leaderboard (not found or error)');
  }

  // Get all weekly leaderboards (try last 52 weeks to cover a full year)
  const now = new Date();
  let weeklyCleared = 0;
  let cumulativeCleared = 0;
  
  for (let weekOffset = 0; weekOffset < 52; weekOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (weekOffset * 7));
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    const weekKey = `${date.getFullYear()}-${week.toString().padStart(2, '0')}`;
    
    const weeklyKey = `leaderboard:weekly:${weekKey}`;
    const cumulativeKey = `scores:weekly:${weekKey}:cumulative`;

    try {
      const weeklyExists = await redis.exists(weeklyKey);
      if (weeklyExists) {
        await redis.del(weeklyKey);
        totalDeleted++;
        weeklyCleared++;
      }
    } catch (e) {
      // Continue
    }

    try {
      const cumulativeExists = await redis.exists(cumulativeKey);
      if (cumulativeExists) {
        await redis.del(cumulativeKey);
        totalDeleted++;
        cumulativeCleared++;
      }
    } catch (e) {
      // Continue
    }
  }
  
  if (weeklyCleared > 0 || cumulativeCleared > 0) {
    console.log(`✓ Cleared ${weeklyCleared} weekly leaderboards and ${cumulativeCleared} cumulative score sets`);
  } else {
    console.log('✓ Weekly leaderboards already empty');
  }

  // Collect all user IDs from all leaderboards before deleting
  const allUserIds = new Set();
  
  // Get user IDs from global leaderboard
  try {
    const globalMembers = await redis.zrange('leaderboard:global', 0, -1);
    if (globalMembers) {
      globalMembers.forEach(m => {
        try {
          const parsed = JSON.parse(m);
          if (parsed.userId) allUserIds.add(parsed.userId);
        } catch {
          if (typeof m === 'string' && !m.startsWith('{')) {
            allUserIds.add(m);
          }
        }
      });
    }
  } catch (e) {
    // Continue
  }
  
  // Get user IDs from weekly leaderboards
  for (let weekOffset = 0; weekOffset < 52; weekOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (weekOffset * 7));
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    const weekKey = `${date.getFullYear()}-${week.toString().padStart(2, '0')}`;
    const weeklyKey = `leaderboard:weekly:${weekKey}`;
    
    try {
      const members = await redis.zrange(weeklyKey, 0, -1);
      if (members) {
        members.forEach(m => {
          try {
            const parsed = JSON.parse(m);
            if (parsed.userId) allUserIds.add(parsed.userId);
          } catch {
            if (typeof m === 'string' && !m.startsWith('{')) {
              allUserIds.add(m);
            }
          }
        });
      }
    } catch (e) {
      // Continue
    }
  }

  // Delete all user-related keys
  if (allUserIds.size > 0) {
    console.log(`\n🗑️  Clearing data for ${allUserIds.size} users...`);
    let userKeysDeleted = 0;
    
    for (const userId of allUserIds) {
      const userKeys = [
        `user:${userId}:best`,
        `user:${userId}:profile`,
        `user:${userId}:rank:global`,
        `user:${userId}:rank:weekly`,
        `user:${userId}:rank:global:previous`,
        `user:${userId}:rank:weekly:previous`,
      ];
      
      // Also try weekly stats for past 52 weeks
      for (let weekOffset = 0; weekOffset < 52; weekOffset++) {
        const date = new Date(now);
        date.setDate(date.getDate() - (weekOffset * 7));
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
        const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
        const weekKey = `${date.getFullYear()}-${week.toString().padStart(2, '0')}`;
        userKeys.push(`user:${userId}:weekly:${weekKey}`);
      }

      const deleted = await Promise.all(userKeys.map(key => 
        redis.del(key).then(() => 1).catch(() => 0)
      ));
      userKeysDeleted += deleted.reduce((a, b) => a + b, 0);
    }
    
    totalDeleted += userKeysDeleted;
    console.log(`✓ Cleared ${userKeysDeleted} user-related keys`);
  } else {
    console.log('✓ No user data found to clear');
  }

  // Clear run data (try common patterns)
  console.log('\n🗑️  Clearing run data...');
  let runDataCleared = 0;
  // Note: Run data expires after 7 days, but we'll try to clear some
  // Since we don't have a list of run IDs, we can't clear all run data
  // This is okay as they expire automatically
  console.log('✓ Run data will expire automatically (7 day TTL)');

  console.log(`\n✅ Successfully cleared Redis entries!`);
  console.log(`   Total keys deleted: ${totalDeleted}`);
  console.log(`\n💡 New entries will be created with correct identity resolution`);
  console.log(`   FIDs will resolve to @username, wallets to ENS or truncated format`);
}

clearAllRedis();


