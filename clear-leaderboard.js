require('dotenv').config();
const { Redis } = require('@upstash/redis');

async function clearLeaderboard() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.error('Redis not configured');
    process.exit(1);
  }

  const redis = new Redis({ url, token });
  console.log('Clearing leaderboard...');

  const now = new Date();
  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  const currentWeekKey = `${year}-${week.toString().padStart(2, '0')}`;
  const weeklyKey = `leaderboard:weekly:${currentWeekKey}`;
  const cumulativeKey = `scores:weekly:${currentWeekKey}:cumulative`;

  try {
    const globalMembers = await redis.zrange('leaderboard:global', 0, -1);
    const weeklyMembers = await redis.zrange(weeklyKey, 0, -1);
    const cumulativeMembers = await redis.zrange(cumulativeKey, 0, -1);

    const allUserIds = new Set();
    const parseUserId = (member) => {
      try {
        return JSON.parse(member).userId || member;
      } catch {
        return member;
      }
    };

    globalMembers.forEach(m => allUserIds.add(parseUserId(m)));
    weeklyMembers.forEach(m => allUserIds.add(parseUserId(m)));
    cumulativeMembers.forEach(m => allUserIds.add(m));

    await redis.del('leaderboard:global');
    await redis.del(weeklyKey);
    await redis.del(cumulativeKey);
    console.log('✓ Cleared leaderboards');

    if (allUserIds.size > 0) {
      for (const userId of allUserIds) {
        await Promise.all([
          redis.del(`user:${userId}:best`),
          redis.del(`user:${userId}:profile`),
          redis.del(`user:${userId}:rank:global`),
          redis.del(`user:${userId}:rank:weekly`),
          redis.del(`user:${userId}:rank:global:previous`),
          redis.del(`user:${userId}:rank:weekly:previous`),
          redis.del(`user:${userId}:weekly:${currentWeekKey}`),
        ]);
      }
      console.log(`✓ Cleared data for ${allUserIds.size} users`);
    }

    console.log('✅ Done!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

clearLeaderboard();
