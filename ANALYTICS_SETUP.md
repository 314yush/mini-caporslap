# Analytics Setup Guide

## Overview

Comprehensive analytics system for tracking game engagement, user behavior, and optimization opportunities.

## Analytics Modules

### 1. Core Game Events (`src/lib/analytics.ts`)
- `trackGameStart` - Game initialization
- `trackGuess` - Each guess with timing and context
- `trackGameLoss` - Game end with session summary
- `trackStreakMilestone` - Streak achievements
- `trackReprieve*` - Reprieve payment flow

### 2. Session Tracking (`src/lib/analytics/session.ts`)
- Session lifecycle (start, end, duration)
- Activity tracking
- Engagement scoring
- Page views and interactions

### 3. Engagement & Timing (`src/lib/analytics/engagement.ts`)
- Guess timing (how long to decide)
- Action timing (time between actions)
- Drop-off points
- Journey steps (user funnel)
- Difficulty progression
- Retry behavior
- Token interactions
- Social sharing

## Key Metrics to Track

### Engagement Metrics
- **Session Duration**: Total time in session
- **Play Time**: Active gameplay time
- **Games per Session**: How many games started
- **Guesses per Game**: Average guesses before loss
- **Accuracy Rate**: Correct guesses percentage
- **Max Streak**: Highest streak achieved

### Timing Metrics
- **Time to First Guess**: How quickly users start playing
- **Guess Timing**: Time between token display and guess
- **Time Between Games**: Retry speed
- **Time on Loss Screen**: How long users stay after losing
- **Time to Share**: How quickly users share results

### Funnel Metrics
- **Landing → Game Start**: Conversion rate
- **Game Start → First Guess**: Engagement rate
- **First Guess → Streak 5**: Retention rate
- **Loss → Play Again**: Retry rate
- **Loss → Share**: Social engagement rate

### Drop-off Points
- Landing page abandonment
- After first game loss
- Mid-game abandonment
- After viewing leaderboard

## Integration Points

### 1. Initialize Session Tracking
Add to `src/app/page.tsx` or `src/components/game/GameScreen.tsx`:

```typescript
import { initSessionTracking } from '@/lib/analytics';

useEffect(() => {
  if (userId) {
    initSessionTracking(userId);
  }
}, [userId]);
```

### 2. Track Game Start with Timing
In `useGame.ts` `startGame()`:

```typescript
import { trackGameStart, trackGameStartInSession, trackJourneyStep } from '@/lib/analytics';

const gameStartTime = Date.now();
const timeSinceLastGame = lastGameEndTime ? gameStartTime - lastGameEndTime : undefined;

trackGameStart(runId, userId, timeSinceLastGame, !!lastGameEndTime);
trackGameStartInSession();
trackJourneyStep('game_start', gameStartTime - sessionStartTime);
```

### 3. Track Guesses with Timing
In `useGame.ts` `makeGuess()`:

```typescript
import { trackGuess, trackGuessInSession, trackGuessTiming, getCurrentSession } from '@/lib/analytics';

const tokenDisplayTime = gameState.tokenDisplayTime; // Track when token was shown
const timeToGuess = Date.now() - tokenDisplayTime;

trackGuess(runId, guess, correct, streak, currentToken, nextToken, timeToGuess, difficulty, marketCapRatio);
trackGuessInSession(correct, streak);
trackGuessTiming(timeToGuess, streak, difficulty, correct);
```

### 4. Track Game Loss with Context
In `useGame.ts` when game ends:

```typescript
import { trackGameLoss, trackDropOff } from '@/lib/analytics';

const gameDuration = Date.now() - gameStartTime;
const totalGuesses = getCurrentSession()?.totalGuesses || 0;
const accuracy = totalGuesses > 0 
  ? (getCurrentSession()?.correctGuesses || 0) / totalGuesses * 100 
  : 0;

trackGameLoss(runId, finalStreak, usedReprieve, lastToken, gameDuration, totalGuesses, accuracy);
trackDropOff('loss_screen', 0, finalStreak);
```

### 5. Track Retry Behavior
In `playAgain()`:

```typescript
import { trackRetry, trackJourneyStep } from '@/lib/analytics';

const timeSinceLoss = Date.now() - lossTime;
const timeBetweenGames = Date.now() - lastGameEndTime;

trackRetry(previousStreak, timeSinceLoss, timeBetweenGames);
trackJourneyStep('play_again', Date.now() - sessionStartTime);
```

### 6. Track Token Display Time
Track when tokens are displayed for timing calculations:

```typescript
const [tokenDisplayTime, setTokenDisplayTime] = useState<number | null>(null);

useEffect(() => {
  if (gameState.nextToken) {
    setTokenDisplayTime(Date.now());
  }
}, [gameState.nextToken]);
```

### 7. Track Difficulty Progression
When difficulty changes:

```typescript
import { trackDifficultyProgression } from '@/lib/analytics';

useEffect(() => {
  const currentDifficulty = getDifficultyForStreak(streak);
  if (previousDifficulty && previousDifficulty !== currentDifficulty) {
    trackDifficultyProgression(previousDifficulty, currentDifficulty, streak, timeAtDifficulty);
  }
}, [streak]);
```

### 8. Track Social Sharing
In share components:

```typescript
import { trackSocialShare, trackShareInSession } from '@/lib/analytics';

const handleShare = (platform: string) => {
  trackSocialShare(platform, streak, 'loss');
  trackShareInSession();
};
```

### 9. Track Leaderboard Engagement
In leaderboard page:

```typescript
import { trackLeaderboardEngagement, trackPageView } from '@/lib/analytics';

useEffect(() => {
  trackPageView('leaderboard');
  const startTime = Date.now();
  
  return () => {
    const timeOnPage = Date.now() - startTime;
    trackLeaderboardEngagement('view', timeOnPage);
  };
}, []);
```

## Vercel Analytics Dashboard

### Key Events to Monitor

1. **session_start / session_end**
   - Session duration
   - Engagement score
   - Games per session

2. **game_start**
   - Time since last game
   - Retry rate

3. **game_guess**
   - Time to guess
   - Accuracy by difficulty
   - Market cap ratio

4. **game_loss**
   - Game duration
   - Total guesses
   - Final accuracy

5. **journey_step**
   - Funnel conversion rates
   - Time to each step

6. **drop_off**
   - Where users leave
   - Time on each stage

7. **retry**
   - Retry speed
   - Previous streak impact

8. **social_share**
   - Share rate
   - Platform preferences

## Optimization Opportunities

### Based on Analytics Data

1. **High Drop-off at Landing**
   - Improve onboarding
   - Add tutorial
   - Show social proof

2. **Slow First Guess**
   - Simplify UI
   - Add hints
   - Improve token display

3. **Low Retry Rate**
   - Improve loss screen
   - Add incentives
   - Show progress

4. **Low Share Rate**
   - Improve share UI
   - Add share incentives
   - Better share messages

5. **High Abandonment Mid-Game**
   - Reduce difficulty spikes
   - Add checkpoints
   - Improve feedback

## Next Steps

1. Integrate session tracking into GameScreen
2. Add timing tracking to guess flow
3. Track token display times
4. Add journey step tracking
5. Monitor analytics dashboard
6. Iterate based on data




