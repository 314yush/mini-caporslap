# Code Sync Guide

Step-by-step guide for keeping the mini-app and desktop versions in sync.

## Overview

This guide helps you manually sync shared code between:
- **Mini-app repo**: Current codebase (Farcaster auth)
- **Desktop repo**: GitHub repo (Privy auth)

## Pre-Sync Checklist

Before starting a sync:

- [ ] Identify which features/changes need to be synced
- [ ] Review changes in source repo
- [ ] Check for breaking changes
- [ ] Note any platform-specific adaptations needed
- [ ] Backup target repo (create a branch)

## Sync Checklist Template

Use this checklist for each sync operation:

### Core Game Logic
- [ ] `src/lib/game-core/` - All files
- [ ] `src/lib/data/` - Token data and APIs
- [ ] `src/lib/leaderboard/` - Leaderboard logic
- [ ] `src/lib/redis.ts` - Redis operations

### Game Components
- [ ] `src/components/game/` - All game UI components
- [ ] `src/hooks/useGame.ts` - Game state management
- [ ] `src/hooks/useGameTimer.ts` - Timer logic

### API Routes
- [ ] `src/app/api/game/` - Game endpoints
- [ ] `src/app/api/leaderboard/` - Leaderboard endpoints
- [ ] `src/app/api/reprieve/verify/route.ts` - Reprieve verification

### Analytics
- [ ] `src/lib/analytics/` - Analytics tracking

### Payments
- [ ] `src/lib/payments/usdc-payment.ts` - Payment logic
- [ ] `src/hooks/useReprievePayment.ts` - Payment hook (if shared)

### Utilities
- [ ] `src/lib/branding/` - Branding assets
- [ ] `src/lib/feature-flags.ts` - Feature flags

## Step-by-Step Sync Process

### 1. Identify Changes

```bash
# In source repo, check what changed
git log --oneline --since="1 week ago"
git diff main...feature-branch
```

### 2. Review Changes

For each changed file:
- Is it in the "Shared Code" list? → Sync it
- Is it platform-specific? → Skip it
- Unsure? → Review carefully

### 3. Copy Files

**Option A: Manual Copy**
1. Open source file
2. Copy contents
3. Paste into target repo (same path)
4. Review for platform-specific code

**Option B: Git Patch**
```bash
# Create patch from source repo
git format-patch -1 <commit-hash> -- <file-path>

# Apply to target repo
git apply <patch-file>
```

### 4. Adapt Platform-Specific Code

After copying, check for:
- Auth-related code (use platform's auth system)
- Environment detection (may differ)
- Import paths (should be same)
- Type definitions (should match)

### 5. Test

- [ ] Test on mini-app
- [ ] Test on desktop
- [ ] Verify leaderboard works
- [ ] Verify game logic works
- [ ] Check for console errors

### 6. Commit

```bash
git add <synced-files>
git commit -m "Sync: <feature-name> from <source-repo>"
```

## Common Sync Scenarios

### Scenario 1: New Game Feature

**Example**: Adding a new difficulty level

1. **Source**: Mini-app repo adds `difficulty.ts` changes
2. **Check**: Is `difficulty.ts` in shared code? ✅ Yes
3. **Sync**: Copy `src/lib/game-core/difficulty.ts`
4. **Adapt**: No changes needed (pure logic)
5. **Test**: Both platforms

### Scenario 2: UI Improvement

**Example**: Better token card design

1. **Source**: Mini-app repo updates `TokenCard.tsx`
2. **Check**: Is `TokenCard.tsx` in shared code? ✅ Yes
3. **Sync**: Copy `src/components/game/TokenCard.tsx`
4. **Adapt**: Check for auth-specific code (should be none)
5. **Test**: Both platforms

### Scenario 3: New API Endpoint

**Example**: Prize pool API

1. **Source**: Mini-app repo adds `prizepool/route.ts`
2. **Check**: Is API route in shared code? ✅ Yes (game logic)
3. **Sync**: Copy `src/app/api/leaderboard/prizepool/route.ts`
4. **Adapt**: Ensure userId normalization works (should already)
5. **Test**: Both platforms

### Scenario 4: Auth-Related Change

**Example**: User profile display

1. **Source**: Mini-app repo updates user display
2. **Check**: Does it use `useAuth()`? ⚠️ Maybe
3. **Review**: Check if it uses platform-specific auth
4. **Decision**: 
   - If uses `userId` only → Sync it
   - If uses `fid` or Privy-specific → Adapt per platform

## Files to NEVER Sync

These are always platform-specific:

- `src/lib/auth/platforms/farcaster.ts` (mini-app only)
- `src/lib/auth/platforms/privy.ts` (desktop only)
- `src/hooks/useAuth.ts` (different implementations)
- `src/components/providers/MiniAppProvider.tsx` (mini-app only)
- `src/app/.well-known/farcaster.json/` (mini-app only)
- `src/lib/environment.ts` (different detection logic)

## Conflict Resolution

If you encounter conflicts:

1. **Auth conflicts**: Keep platform-specific implementation
2. **Import conflicts**: Check if import path is correct
3. **Type conflicts**: Ensure types match in `types.ts` files
4. **Logic conflicts**: Review which version is correct

## Verification

After syncing, verify:

```bash
# Check for TypeScript errors
npm run build

# Check for linting errors
npm run lint

# Run tests (if available)
npm test
```

## Sync Frequency

Recommended sync schedule:

- **Weekly**: Core game logic changes
- **As needed**: New features
- **Before releases**: Full sync check
- **After major features**: Comprehensive sync

## Notes

- Always test on both platforms after syncing
- Keep a changelog of what was synced
- Document any platform-specific adaptations made
- If unsure, ask before syncing
