/**
 * Script to clear Redis cache
 * Usage: node scripts/clear-redis-cache.js [options]
 * 
 * Options:
 *   --profiles    Clear all user profile caches (for identity resolution)
 *   --all         Clear all cache (profiles, leaderboards, etc.)
 *   --user <id>   Clear cache for specific user ID
 */

const { createClient } = require('@redis/client');

const REDIS_URL = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL || 'redis://localhost:6379';

async function clearCache() {
  const args = process.argv.slice(2);
  const clearProfiles = args.includes('--profiles');
  const clearAll = args.includes('--all');
  const userIndex = args.indexOf('--user');
  const specificUserId = userIndex >= 0 ? args[userIndex + 1] : null;

  if (!clearProfiles && !clearAll && !specificUserId) {
    console.log(`
Usage: node scripts/clear-redis-cache.js [options]

Options:
  --profiles          Clear all user profile caches (for identity resolution)
  --all               Clear all cache (profiles, leaderboards, etc.)
  --user <userId>     Clear cache for specific user ID

Examples:
  node scripts/clear-redis-cache.js --profiles
  node scripts/clear-redis-cache.js --user 0x1234...5678
  node scripts/clear-redis-cache.js --all
    `);
    process.exit(1);
  }

  let client;
  try {
    // Parse Redis URL
    if (REDIS_URL.startsWith('redis://') || REDIS_URL.startsWith('rediss://')) {
      client = createClient({ url: REDIS_URL });
    } else {
      // Upstash REST API
      console.error('This script requires a direct Redis connection (redis://), not REST API');
      console.error('Use the API endpoint /api/admin/clear-cache instead');
      process.exit(1);
    }

    await client.connect();
    console.log('Connected to Redis\n');

    if (specificUserId) {
      // Clear specific user
      const keys = [
        `user:${specificUserId}:profile`,
        `user:${specificUserId}:best`,
        `user:${specificUserId}:rank:global`,
        `user:${specificUserId}:rank:weekly`,
      ];
      
      let deleted = 0;
      for (const key of keys) {
        const result = await client.del(key);
        if (result) {
          console.log(`✓ Deleted ${key}`);
          deleted++;
        }
      }
      
      // Also check for weekly stats (pattern matching)
      const weekKey = getWeekKey();
      const weeklyStatsKey = `user:${specificUserId}:weekly:${weekKey}`;
      const deletedWeekly = await client.del(weeklyStatsKey);
      if (deletedWeekly) {
        console.log(`✓ Deleted ${weeklyStatsKey}`);
        deleted++;
      }
      
      console.log(`\nDeleted ${deleted} keys for user ${specificUserId}`);
    } else if (clearProfiles) {
      // Clear all user profiles
      console.log('Scanning for user profile keys...');
      let cursor = 0;
      let totalDeleted = 0;
      
      do {
        const result = await client.scan(cursor, {
          MATCH: 'user:*:profile',
          COUNT: 100,
        });
        cursor = result.cursor;
        const keys = result.keys;
        
        if (keys.length > 0) {
          const deleted = await client.del(keys);
          totalDeleted += deleted;
          console.log(`Deleted ${deleted} profile keys (total: ${totalDeleted})`);
        }
      } while (cursor !== 0);
      
      console.log(`\n✓ Cleared ${totalDeleted} user profile caches`);
    } else if (clearAll) {
      // Clear everything
      console.log('⚠️  WARNING: This will delete ALL Redis data!');
      console.log('Clearing all keys...');
      
      const result = await client.flushDb();
      console.log('✓ Cleared all Redis data');
    }

    await client.quit();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
    if (client) {
      await client.quit().catch(() => {});
    }
    process.exit(1);
  }
}

function getWeekKey() {
  const now = new Date();
  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-${week.toString().padStart(2, '0')}`;
}

clearCache();

