# Desktop Repo Setup Checklist

**Repo**: https://github.com/314yush/clap-or-slap

This checklist covers what needs to be done in the desktop repo to enable dual platform sync.

## Phase 1: Copy Shared Code Files

Copy these files/directories from the mini-app repo to desktop repo:

### Core Game Logic
- [ ] `src/lib/game-core/` - Entire directory
  - [ ] `comparison.ts`
  - [ ] `difficulty.ts`
  - [ ] `reprieve.ts`
  - [ ] `seeded-selection.ts`
  - [ ] `sequencing.ts`
  - [ ] `streak.ts`
  - [ ] `timer.ts`
  - [ ] `types.ts`
  - [ ] `validator.ts`
  - [ ] `index.ts`

### Data Layer
- [ ] `src/lib/data/` - Entire directory
  - [ ] `coingecko.ts`
  - [ ] `dexscreener.ts` (if exists)
  - [ ] `index.ts`
  - [ ] `token-categories.ts`
  - [ ] `token-pool.ts`

### Leaderboard System
- [ ] `src/lib/leaderboard/` - Entire directory
  - [ ] `index.ts`
  - [ ] `overtake.ts`

### Storage
- [ ] `src/lib/redis.ts`

### Game Components
- [ ] `src/components/game/` - Entire directory
  - [ ] `ActionButtons.tsx`
  - [ ] `CorrectOverlay.tsx`
  - [ ] `DifficultyBadge.tsx`
  - [ ] `GameScreen.tsx`
  - [ ] `GameTimer.tsx`
  - [ ] `LiveOvertakeToast.tsx`
  - [ ] `LossScreen.tsx`
  - [ ] `OvertakeNotification.tsx`
  - [ ] `StreakDisplay.tsx`
  - [ ] `TokenCard.tsx`
  - [ ] `TokenInfoTooltip.tsx`
  - [ ] `index.ts`

### Game Hooks
- [ ] `src/hooks/useGame.ts`
- [ ] `src/hooks/useGameTimer.ts`

### API Routes
- [ ] `src/app/api/game/` - Entire directory
  - [ ] `start/route.ts`
  - [ ] `guess/route.ts`
- [ ] `src/app/api/leaderboard/` - Entire directory
  - [ ] `route.ts`
  - [ ] `submit/route.ts`
  - [ ] `check-overtakes/route.ts`

### Analytics
- [ ] `src/lib/analytics/` - Entire directory
  - [ ] `index.ts`
  - [ ] `engagement.ts`
  - [ ] `posthog.ts`
  - [ ] `session.ts`

### Payments
- [ ] `src/lib/payments/usdc-payment.ts`
- [ ] `src/app/api/reprieve/verify/route.ts`

### Utilities
- [ ] `src/lib/branding/` - Entire directory
- [ ] `src/lib/feature-flags.ts`

## Phase 2: Auth Abstraction Setup

### Copy Auth Structure
- [ ] `src/lib/auth/types.ts` - Shared auth types
- [ ] `src/lib/auth/platforms/index.ts` - Platform factory
- [ ] `src/lib/auth/identity-resolver.ts` - Identity resolution (works for both)

### Create Privy Auth Module
- [ ] Create `src/lib/auth/platforms/privy.ts`

**Implementation Requirements:**
```typescript
// src/lib/auth/platforms/privy.ts
import type { AuthProvider, PlatformUser } from '../types';
import { usePrivy } from '@privy-io/react-auth';

export function createPrivyAuthProvider(): AuthProvider {
  // Implementation here
  // Must return normalized userId: privyUser.wallet?.address || privyUser.id
}

export function privyUserToPlatformUser(privyUser: PrivyUser): PlatformUser {
  // Convert Privy user to PlatformUser format
  return {
    userId: privyUser.wallet?.address || privyUser.id,
    displayName: privyUser.wallet?.address || privyUser.email || 'User',
    avatarUrl: privyUser.wallet?.ens?.avatar || undefined,
    platform: 'privy',
    walletAddress: privyUser.wallet?.address,
  };
}
```

**Reference**: See `AUTH_ABSTRACTION.md` for detailed implementation guide.

### Update useAuth Hook
- [ ] Modify `src/hooks/useAuth.ts` to use Privy provider

**Key Requirements:**
- Use Privy's `usePrivy()` hook
- Return same interface as mini-app version
- Normalize `userId` to: `privyUser.wallet?.address || privyUser.id`
- Maintain backward compatibility with existing code

**Example Structure:**
```typescript
export function useAuth(): AuthState {
  const { ready, authenticated, user: privyUser, login: privyLogin, logout: privyLogout } = usePrivy();
  
  // Convert Privy user to PlatformUser
  const platformUser = privyUser ? privyUserToPlatformUser(privyUser) : null;
  const userId = platformUser?.userId || null;
  
  return {
    isReady: ready,
    isAuthenticated: authenticated,
    isLoading: false,
    userId,
    platformUser,
    // ... rest of interface
  };
}
```

## Phase 3: Update Platform Detection

- [ ] Update `src/lib/environment.ts` to detect desktop environment
- [ ] Ensure `getAuthPlatform()` returns `'privy'` for desktop

## Phase 4: Update Components

### Auth Components
- [ ] Update `src/components/auth/ConnectButton.tsx` to use Privy
- [ ] Update `src/components/auth/UserMenu.tsx` to use Privy user data
- [ ] Ensure components use `userId` from `useAuth()` (platform-agnostic)

### Providers
- [ ] Ensure PrivyProvider wraps the app (if not already)
- [ ] Remove any Farcaster-specific providers

## Phase 5: Testing

### Auth Flow
- [ ] [ ] User can connect wallet via Privy
- [ ] [ ] `userId` is normalized correctly (wallet address or Privy ID)
- [ ] [ ] Auth state persists across page reloads
- [ ] [ ] Logout works correctly

### Game Flow
- [ ] [ ] Game starts correctly
- [ ] [ ] Guesses work
- [ ] [ ] Streak tracking works
- [ ] [ ] Leaderboard submission works with Privy userId

### Leaderboard
- [ ] [ ] Can view leaderboard
- [ ] [ ] Can submit scores
- [ ] [ ] User rank displays correctly
- [ ] [ ] Overtake notifications work

### Integration
- [ ] [ ] No TypeScript errors
- [ ] [ ] No runtime errors
- [ ] [ ] All shared code works with Privy auth

## Phase 6: Documentation

- [ ] Copy documentation files from mini-app:
  - [ ] `ARCHITECTURE.md`
  - [ ] `SYNC_GUIDE.md`
  - [ ] `AUTH_ABSTRACTION.md`
  - [ ] `DUAL_PLATFORM_SYNC.md`

## Quick Copy Commands

If both repos are cloned locally:

```bash
# From mini-app repo root
MINIAPP_REPO="/path/to/miniapp/repo"
DESKTOP_REPO="/path/to/desktop/repo"

# Copy shared directories
cp -r $MINIAPP_REPO/src/lib/game-core $DESKTOP_REPO/src/lib/
cp -r $MINIAPP_REPO/src/lib/data $DESKTOP_REPO/src/lib/
cp -r $MINIAPP_REPO/src/lib/leaderboard $DESKTOP_REPO/src/lib/
cp $MINIAPP_REPO/src/lib/redis.ts $DESKTOP_REPO/src/lib/
cp -r $MINIAPP_REPO/src/components/game $DESKTOP_REPO/src/components/
cp $MINIAPP_REPO/src/hooks/useGame.ts $DESKTOP_REPO/src/hooks/
cp $MINIAPP_REPO/src/hooks/useGameTimer.ts $DESKTOP_REPO/src/hooks/
cp -r $MINIAPP_REPO/src/app/api/game $DESKTOP_REPO/src/app/api/
cp -r $MINIAPP_REPO/src/app/api/leaderboard $DESKTOP_REPO/src/app/api/
cp -r $MINIAPP_REPO/src/lib/analytics $DESKTOP_REPO/src/lib/
cp $MINIAPP_REPO/src/lib/payments/usdc-payment.ts $DESKTOP_REPO/src/lib/payments/
cp -r $MINIAPP_REPO/src/lib/branding $DESKTOP_REPO/src/lib/
cp $MINIAPP_REPO/src/lib/feature-flags.ts $DESKTOP_REPO/src/lib/

# Copy auth abstraction (shared parts)
mkdir -p $DESKTOP_REPO/src/lib/auth/platforms
cp $MINIAPP_REPO/src/lib/auth/types.ts $DESKTOP_REPO/src/lib/auth/
cp $MINIAPP_REPO/src/lib/auth/platforms/index.ts $DESKTOP_REPO/src/lib/auth/platforms/
cp $MINIAPP_REPO/src/lib/auth/identity-resolver.ts $DESKTOP_REPO/src/lib/auth/
```

## Critical Notes

1. **User ID Normalization**: Must normalize to string format:
   - Desktop: `privyUser.wallet?.address || privyUser.id`
   - This allows shared code to work with both platforms

2. **Don't Copy**:
   - `src/lib/auth/platforms/farcaster.ts` (mini-app only)
   - `src/hooks/useAuthDev.ts` (mini-app only)
   - `src/app/.well-known/farcaster.json/` (mini-app only)
   - `src/components/providers/MiniAppProvider.tsx` (mini-app only)

3. **Review Before Copying**:
   - `src/lib/environment.ts` - May need desktop-specific changes
   - `src/lib/social/sharing.ts` - Different sharing methods
   - `src/components/auth/` - Different auth UI

## After Setup

Once setup is complete:

1. **Test thoroughly** on desktop
2. **Start syncing** new features using `SYNC_GUIDE.md`
3. **Keep shared code in sync** between repos

## Need Help?

- **What files to copy?** → See `ARCHITECTURE.md` → "Shared Code" section
- **How to implement Privy?** → See `AUTH_ABSTRACTION.md`
- **How to sync future changes?** → See `SYNC_GUIDE.md`



