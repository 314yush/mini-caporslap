# PostHog Analytics Setup Guide

## Why PostHog?

**Vercel Analytics Free Tier:**
- ❌ No custom events support
- 💰 Pro plan required: $20/month

**PostHog Free Tier:**
- ✅ **1 million events/month FREE**
- ✅ Custom events support
- ✅ Funnels, retention, session replay
- ✅ No credit card required

## Quick Setup (5 minutes)

### Step 1: Create PostHog Account

1. Go to [posthog.com](https://posthog.com)
2. Click "Sign up for free"
3. Create a new project (e.g., "CapOrSlap")
4. Copy your **Project API Key** (starts with `phc_`)

### Step 2: Add Environment Variable

Add to your `.env` file:

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_your_project_key_here
```

For EU region (optional):
```bash
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

### Step 3: Deploy

That's it! PostHog is already integrated. Just:
1. Add the env var to your Vercel project settings
2. Redeploy

## Viewing Analytics

### PostHog Dashboard

1. Go to [app.posthog.com](https://app.posthog.com)
2. Sign in to your account
3. Select your project

### Key Views

#### **Events**
- View all tracked events
- Filter by event name, properties, time range
- See event counts and trends

#### **Insights**
- Create charts and graphs
- Track funnels (e.g., landing → game start → first guess)
- Analyze retention

#### **Session Replay** (5K/month free)
- Watch user sessions
- See exactly what users do
- Debug issues

#### **Funnels**
- Track conversion rates
- See where users drop off
- Optimize user journey

## Events You'll See

All our analytics events are automatically tracked:

- `session_start` / `session_end`
- `game_start`
- `game_guess`
- `game_loss`
- `journey_step`
- `retry`
- `social_share`
- `guess_timing`
- `drop_off`
- And many more!

## Example Queries

### Find average session duration:
1. Go to Insights
2. Create new insight
3. Select "Average" of `session_end` event
4. Group by `duration` property

### Find retry rate:
1. Go to Funnels
2. Create funnel: `game_loss` → `retry`
3. See conversion rate

### Find drop-off points:
1. Go to Events
2. Filter by `drop_off`
3. Group by `stage` property

## Migration from Vercel Analytics

The code is already set up to use PostHog when available. It will:
- ✅ Use PostHog if `NEXT_PUBLIC_POSTHOG_KEY` is set
- ✅ Fallback to console logging in development
- ✅ Still work with Vercel Analytics if you upgrade to Pro

## Cost

**Free tier includes:**
- 1 million events/month
- 5,000 session replays/month
- Unlimited team members
- All core features

**If you exceed 1M events:**
- $0.000225 per event
- Or upgrade to paid plan

For a game, 1M events/month is typically plenty unless you have massive scale.

## Privacy

PostHog is privacy-focused:
- GDPR compliant
- Can self-host (open source)
- Masks sensitive data by default
- No cookies required

## Support

- [PostHog Docs](https://posthog.com/docs)
- [PostHog Community](https://posthog.com/community)






