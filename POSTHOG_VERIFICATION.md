# PostHog Setup Verification Guide

## Quick Verification Steps

### Step 1: Check Environment Variable

**Local Development:**
```bash
# Check if the variable is set
echo $NEXT_PUBLIC_POSTHOG_KEY

# Or check your .env file
cat .env | grep POSTHOG
```

**Vercel Production:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify `NEXT_PUBLIC_POSTHOG_KEY` is set
3. Make sure it's available for all environments (Production, Preview, Development)

### Step 2: Check Browser Console

1. Open your app in the browser
2. Open Developer Tools (F12 or Cmd+Option+I)
3. Go to the **Console** tab
4. Look for one of these messages:

**✅ Success:**
```
[PostHog] Initialized
```

**❌ Missing Key:**
```
[PostHog] NEXT_PUBLIC_POSTHOG_KEY not set, analytics disabled
```

**❌ Not Initialized:**
```
[PostHog] Not initialized, call initPostHog() first
```

### Step 3: Check Network Requests

1. Open Developer Tools → **Network** tab
2. Filter by "posthog" or "i.posthog.com"
3. Reload the page
4. You should see requests to PostHog API:
   - `batch/` - Event batching endpoint
   - `decide/` - Feature flags/config endpoint

**✅ Success:** You see POST requests to `https://us.i.posthog.com/batch/` (or your custom host)

**❌ Failure:** No requests appear (PostHog not initialized)

### Step 4: Test Event Tracking

1. Open your app
2. Open Developer Tools → **Console**
3. Run this test command:
```javascript
// Check if PostHog is loaded
window.posthog && console.log('PostHog loaded:', window.posthog);

// Manually trigger a test event
window.posthog?.capture('test_event', { test: true });
```

**✅ Success:** No errors, event is sent

**❌ Failure:** `window.posthog is undefined` (PostHog not initialized)

### Step 5: Check PostHog Dashboard

1. Go to [app.posthog.com](https://app.posthog.com)
2. Sign in to your account
3. Select your project
4. Go to **Events** tab
5. You should see events appearing in real-time:
   - `session_start`
   - `game_start` (when you start a game)
   - `game_guess` (when you make guesses)
   - `$pageview` (page views)

**✅ Success:** Events appear within 1-2 seconds

**❌ Failure:** No events appear (check API key, network, or initialization)

### Step 6: Test Game Events

1. Play a game in your app
2. Make a few guesses
3. Check PostHog Dashboard → **Events**
4. You should see:
   - `game_start` with properties (runId, userId, etc.)
   - `game_guess` events with properties (guess, correct, streak, etc.)
   - `session_start` / `session_end`

**✅ Success:** All game events appear with correct properties

**❌ Failure:** Events missing or properties incorrect

## Debugging Checklist

### If PostHog isn't initializing:

- [ ] `NEXT_PUBLIC_POSTHOG_KEY` is set in `.env` (local) or Vercel (production)
- [ ] Key starts with `phc_` (correct format)
- [ ] App has been rebuilt/redeployed after adding the key
- [ ] No browser console errors
- [ ] Network requests aren't blocked by ad blockers

### If events aren't appearing:

- [ ] PostHog initialized successfully (check console)
- [ ] Network requests to PostHog are successful (200 status)
- [ ] Events are being called in the code (check console logs)
- [ ] PostHog dashboard is showing the correct project
- [ ] Time range in dashboard includes "Last 24 hours" or "All time"

### Common Issues

**Issue:** "NEXT_PUBLIC_POSTHOG_KEY not set"
- **Fix:** Add the key to `.env` and restart dev server, or add to Vercel env vars and redeploy

**Issue:** Events appear in console but not in dashboard
- **Fix:** Check network tab - requests might be failing. Check PostHog project settings.

**Issue:** PostHog loads but events don't track
- **Fix:** Check browser console for errors. Verify `isPostHogReady()` returns true.

**Issue:** Ad blocker blocking PostHog
- **Fix:** Disable ad blocker or add PostHog domain to allowlist

## Manual Test Script

Run this in your browser console to test everything:

```javascript
// 1. Check PostHog is loaded
console.log('PostHog loaded:', !!window.posthog);

// 2. Check initialization
if (window.posthog) {
  console.log('PostHog config:', window.posthog.config);
  
  // 3. Send test event
  window.posthog.capture('manual_test_event', {
    test: true,
    timestamp: Date.now(),
    source: 'manual_verification'
  });
  
  console.log('✅ Test event sent! Check PostHog dashboard.');
} else {
  console.error('❌ PostHog not loaded. Check initialization.');
}
```

## Automated Verification

We've added a debug endpoint you can use:

Visit: `http://localhost:3000/api/debug/posthog` (or your production URL)

This will show:
- PostHog initialization status
- Environment variable status
- Recent events (if any)

## Still Having Issues?

1. Check the browser console for errors
2. Check Network tab for failed requests
3. Verify API key in PostHog dashboard → Project Settings
4. Try a different browser (ad blockers can interfere)
5. Check PostHog status: https://status.posthog.com/




