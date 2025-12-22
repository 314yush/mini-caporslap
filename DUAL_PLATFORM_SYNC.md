# Dual Platform Sync Strategy - Quick Start Guide

## What's Been Implemented ✅

### 1. Auth Abstraction Layer
- **Created**: Unified auth interface (`src/lib/auth/types.ts`)
- **Created**: Farcaster platform module (`src/lib/auth/platforms/farcaster.ts`)
- **Updated**: `useAuth()` hook to use abstraction (backward compatible)
- **Result**: Both platforms can use the same auth interface

### 2. Documentation
- **ARCHITECTURE.md**: Lists all shared vs platform-specific files
- **SYNC_GUIDE.md**: Step-by-step sync process with checklist
- **AUTH_ABSTRACTION.md**: How auth abstraction works

## What's Left to Do

### For Desktop Repo (GitHub: 314yush/clap-or-slap)

1. **Create Privy Auth Module**
   - File: `src/lib/auth/platforms/privy.ts`
   - Follow pattern in `AUTH_ABSTRACTION.md`
   - Return normalized `userId` (wallet address or Privy ID)

2. **Update useAuth Hook**
   - Modify `src/hooks/useAuth.ts` to use Privy provider
   - Keep same interface as mini-app version

3. **Copy Shared Code**
   - Copy all files listed in `ARCHITECTURE.md` under "Shared Code"
   - Keep platform-specific files separate

## How to Use the Sync Strategy

### Step 1: Initial Setup (One-Time)

**In Desktop Repo:**

1. **Copy shared code files** from mini-app to desktop:
   ```bash
   # Copy these directories/files (see ARCHITECTURE.md for full list):
   - src/lib/game-core/
   - src/lib/data/
   - src/lib/leaderboard/ (overtake.ts, index.ts)
   - src/lib/redis.ts
   - src/components/game/
   - src/hooks/useGame.ts
   - src/hooks/useGameTimer.ts
   - src/app/api/game/
   - src/app/api/leaderboard/ (except prizepool)
   - src/lib/analytics/
   - src/lib/payments/usdc-payment.ts
   ```

2. **Copy auth abstraction structure:**
   ```bash
   - src/lib/auth/types.ts  # Shared types
   - src/lib/auth/platforms/index.ts  # Platform factory
   ```

3. **Create Privy implementation:**
   - Create `src/lib/auth/platforms/privy.ts`
   - Implement `createPrivyAuthProvider()` function
   - Normalize `userId` to: `privyUser.wallet?.address || privyUser.id`

4. **Update useAuth hook:**
   - Modify to use Privy provider instead of Farcaster
   - Keep same return interface

### Step 2: Syncing New Features (Ongoing)

**When you add a feature to mini-app and want it on desktop:**

1. **Check if it's shared code:**
   - Look in `ARCHITECTURE.md` - is the file listed under "Shared Code"?
   - If yes → sync it
   - If no → it's platform-specific, skip it

2. **Use the sync checklist** from `SYNC_GUIDE.md`:
   ```
   [ ] Identify changed files
   [ ] Review for platform-specific code
   [ ] Copy to desktop repo
   [ ] Test on desktop
   [ ] Commit changes
   ```

3. **Example sync workflow:**
   ```bash
   # In mini-app repo
   git log --oneline --since="1 week ago"  # See what changed
   
   # Copy specific file
   cp src/lib/game-core/difficulty.ts /path/to/desktop/src/lib/game-core/
   
   # In desktop repo
   git add src/lib/game-core/difficulty.ts
   git commit -m "Sync: Update difficulty logic from mini-app"
   ```

### Step 3: Testing After Sync

**Always test on both platforms:**
- [ ] Game logic works correctly
- [ ] Leaderboard submissions work
- [ ] Auth flow works (different per platform)
- [ ] No TypeScript errors
- [ ] No runtime errors

## Key Principles

### ✅ DO Sync:
- Game mechanics changes
- Token pool updates
- Leaderboard logic
- Game components (UI)
- Analytics tracking
- Payment logic (if shared)

### ❌ DON'T Sync:
- Auth implementations (`platforms/farcaster.ts` vs `platforms/privy.ts`)
- Auth hooks (different implementations)
- Environment detection (different logic)
- Platform providers (MiniAppProvider vs PrivyProvider)
- Farcaster-specific routes (`.well-known/farcaster.json`)

## User ID Normalization

**Critical**: Both platforms must normalize user IDs to strings:

- **Mini-app**: `userId = String(fid)` (Farcaster ID)
- **Desktop**: `userId = privyUser.wallet?.address || privyUser.id` (Wallet or Privy ID)

This allows shared code (leaderboard, game state, etc.) to work with both platforms.

## Quick Reference

### Files to Always Sync
See `ARCHITECTURE.md` → "Shared Code" section

### How to Sync
See `SYNC_GUIDE.md` → Step-by-step process

### Auth Implementation
See `AUTH_ABSTRACTION.md` → Implementation guide

## Common Scenarios

### Scenario: New Game Feature
1. Add feature to mini-app (e.g., new difficulty level)
2. Check: Is it in `src/lib/game-core/`? ✅ Yes
3. Copy `src/lib/game-core/difficulty.ts` to desktop
4. Test on both platforms
5. Done!

### Scenario: UI Improvement
1. Update component in mini-app (e.g., `TokenCard.tsx`)
2. Check: Is it in `src/components/game/`? ✅ Yes
3. Copy to desktop
4. Test on both platforms
5. Done!

### Scenario: Auth Change
1. Update auth in mini-app
2. Check: Is it in `src/lib/auth/platforms/farcaster.ts`? ⚠️ Platform-specific
3. **Don't sync** - implement equivalent in desktop's Privy module
4. If it's in `types.ts` (shared interface) → sync that
5. Test separately on each platform

## Next Steps

1. **Set up desktop repo** with shared code
2. **Implement Privy auth module** following `AUTH_ABSTRACTION.md`
3. **Test** that both platforms work
4. **Start syncing** new features using the guides

## Need Help?

- **What to sync?** → Check `ARCHITECTURE.md`
- **How to sync?** → Follow `SYNC_GUIDE.md`
- **Auth issues?** → See `AUTH_ABSTRACTION.md`




