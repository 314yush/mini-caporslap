# Score Calculation Logic

## Overview

The leaderboard now uses different scoring systems for weekly vs global leaderboards to better reward engagement and competition.

## Weekly Leaderboard (Prize Pool)

**Score Type: Cumulative Score**

The weekly leaderboard uses **cumulative score**, which is the **sum of all streaks achieved during the week**.

### How it works:
1. Every time a user completes a game run, their streak is added to their weekly cumulative score
2. Example: If a user plays 3 games with streaks of 5, 8, and 12, their cumulative score = 5 + 8 + 12 = **25**
3. This rewards players who play multiple times during the week, not just those who achieve one high streak

### Benefits:
- Encourages multiple play sessions
- Rewards consistent engagement
- Makes the leaderboard more dynamic (players can improve by playing more)
- Better for prize pool distribution (more fair distribution)

### Implementation:
- Stored in Redis: `scores:weekly:{weekKey}:cumulative` (sorted set)
- Updated in: `src/lib/redis.ts` → `trackWeeklyScore()`
- Displayed in: Weekly leaderboard entries as `cumulativeScore`

## Global Leaderboard (All-Time)

**Score Type: Best Streak**

The global leaderboard uses **best streak**, which is the **highest single streak ever achieved**.

### How it works:
1. Only the user's best single-game streak is tracked
2. Example: If a user's best streak is 25, that's their global score (regardless of how many times they've played)
3. This rewards skill and consistency in a single game session

### Benefits:
- Shows true skill level
- Rewards perfect games
- Historical record of best performances

### Implementation:
- Stored in Redis: `leaderboard:global` (sorted set)
- Updated in: `src/lib/redis.ts` → `submitToLeaderboard()`
- Displayed in: Global leaderboard entries as `bestStreak`

## Display Logic

### Weekly Leaderboard:
- **Primary Score**: `cumulativeScore` (sum of all streaks)
- **Secondary Info**: `bestStreak` (best single streak in the week)
- **Display**: Shows cumulative score prominently

### Global Leaderboard:
- **Primary Score**: `bestStreak` (all-time best)
- **Display**: Shows best streak

## Prize Pool Distribution

The weekly prize pool is distributed based on **cumulative scores**:
- Top 50 players by cumulative score
- Weighted distribution: `user_prize = (user_cumulative_score / total_top_50_cumulative_score) * prize_pool`
- Example: If total top 50 score is 1000 and user has 100, they get 10% of the pool

## Data Flow

1. **Game Completion** → `POST /api/leaderboard/submit`
   - Tracks both: best streak (for global) and cumulative score (for weekly)
   
2. **Leaderboard Fetch** → `GET /api/leaderboard?type=weekly`
   - Returns entries with `cumulativeScore` for weekly
   - Returns entries with `bestStreak` for global

3. **Display** → Leaderboard components
   - Weekly: Shows `cumulativeScore` if available, falls back to `bestStreak`
   - Global: Shows `bestStreak`




