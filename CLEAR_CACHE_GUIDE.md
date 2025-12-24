# How to Clear Redis Cache & Leaderboard

This guide shows you how to clear Redis cache and leaderboard data, especially for refreshing ENS/Farcaster name resolution or rebuilding the leaderboard.

## Why Clear Cache?

When wallet addresses are cached with truncated display names (like `0x1234...5678`), they won't automatically update even if the user later gets an ENS domain or links a Farcaster account. Clearing the cache forces fresh resolution.

## Method 1: API Endpoint (Recommended)

### How to Run API Endpoints

You can call these endpoints from:

1. **Terminal/Command Line** (using `curl`):
   ```bash
   # Replace 'your-domain.com' with your actual domain
   curl -X POST "https://your-domain.com/api/admin/clear-cache?type=profiles"
   ```

2. **Browser** (for testing - but POST requests need a tool):
   - Use browser DevTools Console or a tool like Postman
   - Or use the terminal `curl` command above

3. **Postman/Insomnia** (API testing tools):
   - Method: POST
   - URL: `https://your-domain.com/api/admin/clear-cache?type=profiles`
   - No body required

4. **Node.js/JavaScript**:
   ```javascript
   fetch('https://your-domain.com/api/admin/clear-cache?type=profiles', {
     method: 'POST'
   })
   ```

### Clear User Profile Caches

Use the admin API endpoint to clear cache:

### Clear All User Profiles (from leaderboard)
```bash
# Replace 'caporslap.fun' with your actual domain
curl -X POST "https://caporslap.fun/api/admin/clear-cache?type=profiles"
```

This clears profile caches for all users currently on the leaderboard, forcing fresh ENS/Farcaster resolution.

**Example output:**
```json
{
  "success": true,
  "message": "Cleared 15 user profile caches from leaderboard users",
  "deleted": 15
}
```

### Clear Cache for Specific User
```bash
curl -X POST "https://caporslap.fun/api/admin/clear-cache?type=user&userId=0x1234567890123456789012345678901234567890"
```

Replace `0x1234...` with the actual wallet address or user ID.

### Clear & Rebuild Leaderboard

⚠️ **WARNING: This will delete all leaderboard data!**

```bash
# Clear everything (leaderboards, profiles, streaks, ranks)
curl -X POST "https://caporslap.fun/api/admin/clear-leaderboard?type=all&confirm=true"

# Clear only global leaderboard
curl -X POST "https://caporslap.fun/api/admin/clear-leaderboard?type=global&confirm=true"

# Clear only weekly leaderboard
curl -X POST "https://caporslap.fun/api/admin/clear-leaderboard?type=weekly&confirm=true"

# Clear only user profiles
curl -X POST "https://caporslap.fun/api/admin/clear-leaderboard?type=profiles&confirm=true"
```

**Example output:**
```json
{
  "success": true,
  "message": "Leaderboard cleared successfully",
  "deleted": {
    "globalLeaderboard": 3,
    "weeklyLeaderboard": 3,
    "weeklyCumulativeScores": 3,
    "userProfiles": 3,
    "userBestStreaks": 3,
    "userRanks": 6
  },
  "note": "Users will need to play again to appear on the leaderboard..."
}
```

**Note:** After clearing, users will need to play again to appear on the leaderboard. Their new scores will use wallet addresses (if available) instead of Privy UUIDs.

## Method 2: Redis CLI (Direct Connection)

If you have direct Redis access (not Upstash REST API):

### Clear All User Profiles
```bash
redis-cli --scan --pattern "user:*:profile" | xargs redis-cli del
```

### Clear Specific User
```bash
redis-cli del "user:0x1234567890123456789012345678901234567890:profile"
```

### Clear All Cache (⚠️ Use with caution!)
```bash
redis-cli flushdb
```

## Method 3: Upstash Dashboard

If you're using Upstash:

1. Go to your [Upstash Dashboard](https://console.upstash.com/)
2. Select your Redis database
3. Go to the "Data Browser" tab
4. Search for keys matching `user:*:profile`
5. Delete the keys you want to clear

## Method 4: Node.js Scripts

### Clear Cache Script

Use the provided script (requires direct Redis connection):

```bash
# Clear all user profiles
node scripts/clear-redis-cache.js --profiles

# Clear specific user
node scripts/clear-redis-cache.js --user 0x1234...5678

# Clear everything (⚠️ dangerous!)
node scripts/clear-redis-cache.js --all
```

### Clear Leaderboard Script

```bash
# Clear everything (leaderboards, profiles, streaks, ranks)
node scripts/clear-leaderboard.js --all --confirm

# Clear only global leaderboard
node scripts/clear-leaderboard.js --global --confirm

# Clear only weekly leaderboard
node scripts/clear-leaderboard.js --weekly --confirm

# Clear only user profiles
node scripts/clear-leaderboard.js --profiles --confirm
```

**Note:** The `--confirm` flag is required for safety.

## What Gets Cleared?

### User Profile Cache (`user:{userId}:profile`)
- Contains resolved identity (ENS name, Farcaster username, etc.)
- **This is what you want to clear for identity refresh**
- TTL: 7 days

### Other User Data (optional)
- `user:{userId}:best` - Best streak
- `user:{userId}:rank:global` - Global rank
- `user:{userId}:rank:weekly` - Weekly rank
- `user:{userId}:weekly:{weekKey}` - Weekly stats

## After Clearing Cache

1. **Wait a few seconds** for the cache to clear
2. **Refresh the leaderboard** - it will automatically re-resolve identities
3. **Check the leaderboard** - wallet addresses should now show ENS/Farcaster names if available

## Troubleshooting

### Addresses Still Show as Truncated?

1. **Check if the address has ENS/Farcaster**: Not all addresses have these
2. **Verify API keys**: Ensure `NEYNAR_API_KEY` is set for Farcaster resolution
3. **Check cache again**: The cache might have been repopulated
4. **Wait for next leaderboard load**: The resolution happens when the leaderboard is fetched

### API Endpoint Returns Error?

- Check that Redis is configured (`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`)
- Verify the endpoint is accessible
- Check server logs for detailed error messages

## Key Patterns

The Redis keys follow these patterns:
- `user:{userId}:profile` - User profile/identity cache
- `user:{userId}:best` - Best streak
- `user:{userId}:rank:global` - Global rank
- `user:{userId}:rank:weekly` - Weekly rank
- `leaderboard:global` - Global leaderboard
- `leaderboard:weekly:{weekKey}` - Weekly leaderboard

