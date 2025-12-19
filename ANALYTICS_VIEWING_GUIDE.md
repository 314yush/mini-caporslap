# Where to View Analytics

## PostHog Analytics Dashboard (Recommended - Free!)

Your analytics are tracked using **PostHog** (free tier: 1M events/month). Here's how to access them:

### Step 1: Access PostHog Dashboard

1. Go to [app.posthog.com](https://app.posthog.com) and sign in
2. Select your project (e.g., "CapOrSlap")
3. You'll see your analytics dashboard

### Step 2: View Events

In the PostHog dashboard, you'll see:

#### **Events Tab**
- All custom events we're tracking
- Event counts and trends
- Event properties and metadata
- Filter by event name, properties, time range

#### **Insights Tab**
- Create charts and graphs
- Track funnels (e.g., landing → game start → first guess)
- Analyze retention
- Build custom dashboards

#### **Session Replay** (5K/month free)
- Watch actual user sessions
- See exactly what users do
- Debug issues in real-time

#### **Funnels Tab**
- Track conversion rates
- See where users drop off
- Optimize user journey

---

## Vercel Analytics Dashboard (Pro Plan Only)

**Note:** Vercel Analytics free tier doesn't support custom events. You need Pro ($20/month) to see custom events.

If you have Vercel Pro, you can also view events there:

### Step 1: Access Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Select your project: **caporslap** (or your project name)
3. Click on the **Analytics** tab in the top navigation

### Step 2: View Events

In the Vercel Analytics dashboard, you'll see:

#### **Events Tab**
- All custom events we're tracking
- Event counts and trends
- Event properties and metadata

#### **Key Events to Look For:**

1. **`session_start` / `session_end`**
   - View: Events → Filter by `session_start` or `session_end`
   - See: Session duration, engagement scores, games per session

2. **`game_start`**
   - View: Events → Filter by `game_start`
   - See: Time since last game, retry patterns

3. **`game_guess`**
   - View: Events → Filter by `game_guess`
   - See: Guess timing, accuracy, difficulty, market cap ratios

4. **`game_loss`**
   - View: Events → Filter by `game_loss`
   - See: Game duration, total guesses, accuracy

5. **`journey_step`**
   - View: Events → Filter by `journey_step`
   - See: User funnel progression (landing → game → first guess → milestones → loss)

6. **`retry`**
   - View: Events → Filter by `retry`
   - See: Retry speed, previous streak impact

7. **`social_share`**
   - View: Events → Filter by `social_share`
   - See: Share rate, platform preferences

8. **`guess_timing`**
   - View: Events → Filter by `guess_timing`
   - See: How long users take to make guesses

9. **`drop_off`**
   - View: Events → Filter by `drop_off`
   - See: Where users leave the game

10. **`coingecko_fetch`** / **`token_pool_refresh`**
    - View: Events → Filter by these events
    - See: API performance, token pool refresh times

### Step 3: Analyze Event Properties

Click on any event to see:
- **Event properties**: All the data we're tracking (timing, streak, difficulty, etc.)
- **Event trends**: How events change over time
- **User segments**: Filter by user properties

### Step 4: Create Insights

You can:
- **Filter events** by properties (e.g., `streak > 10`, `correct = true`)
- **Compare time periods** (e.g., this week vs last week)
- **Export data** for deeper analysis

## Quick Access Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Analytics Documentation**: https://vercel.com/docs/analytics

## What to Look For

### Engagement Metrics
- **Session duration**: Are users staying engaged?
- **Games per session**: How many games do users play?
- **Retry rate**: Do users come back after losing?

### Performance Metrics
- **Time to first guess**: Should be < 5 seconds
- **Guess timing**: Are users taking too long?
- **Drop-off points**: Where are users leaving?

### Conversion Metrics
- **Landing → Game Start**: How many start playing?
- **First Guess → Streak 5**: Retention rate
- **Loss → Play Again**: Retry rate
- **Loss → Share**: Social engagement

## Troubleshooting

### If you don't see events:

1. **Check deployment**: Make sure your latest code is deployed
2. **Wait a few minutes**: Events may take a few minutes to appear
3. **Check filters**: Make sure you're not filtering out events
4. **Verify Analytics is enabled**: Check that `<Analytics />` is in your `layout.tsx` (it is ✅)

### If events are missing properties:

- Check the browser console for any errors
- Verify the event is being called with the correct parameters
- Check that Vercel Analytics is properly configured in your project settings

## Example Queries

### Find average session duration:
1. Go to Events → `session_end`
2. Look at the `duration` property
3. Calculate average or view distribution

### Find retry rate:
1. Go to Events → `retry`
2. Count events vs `game_loss` events
3. Calculate: `retry_count / game_loss_count * 100`

### Find drop-off points:
1. Go to Events → `drop_off`
2. Group by `stage` property
3. See which stages have the most drop-offs

## Pro Tips

1. **Set up alerts**: Get notified when key metrics change
2. **Create dashboards**: Save common queries for quick access
3. **Compare periods**: See how changes affect metrics
4. **Export data**: Download CSV for deeper analysis in Excel/Sheets
