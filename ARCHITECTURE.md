# Architecture: Shared vs Platform-Specific Code

This document outlines which files are shared between the mini-app and desktop versions, and which are platform-specific.

## Shared Code (Copy to Both Repos)

These files contain core game logic and should be kept in sync between both repositories.

### Game Core Logic
- `src/lib/game-core/` - All game logic
  - `comparison.ts` - Token comparison logic
  - `difficulty.ts` - Difficulty calculation
  - `reprieve.ts` - Reprieve system logic
  - `seeded-selection.ts` - Token selection algorithm
  - `sequencing.ts` - Game sequence management
  - `streak.ts` - Streak tracking
  - `timer.ts` - Game timer logic
  - `types.ts` - Core type definitions
  - `validator.ts` - Game state validation

### Data Layer
- `src/lib/data/` - Token data and APIs
  - `coingecko.ts` - CoinGecko API client
  - `dexscreener.ts` - DexScreener integration (if used)
  - `index.ts` - Data exports
  - `token-categories.ts` - Token categorization
  - `token-pool.ts` - Token pool management

### Leaderboard System
- `src/lib/leaderboard/` - Leaderboard logic
  - `index.ts` - Leaderboard exports
  - `overtake.ts` - Overtake detection system
  - `prizepool.ts` - Prize pool logic (NEW)

### Redis/Storage
- `src/lib/redis.ts` - Redis operations for leaderboards

### Game Components
- `src/components/game/` - Game UI components
  - `ActionButtons.tsx` - Game action buttons
  - `CorrectOverlay.tsx` - Correct guess overlay
  - `DifficultyBadge.tsx` - Difficulty indicator
  - `GameScreen.tsx` - Main game screen
  - `GameTimer.tsx` - Timer display
  - `LiveOvertakeToast.tsx` - Overtake notifications
  - `LossScreen.tsx` - Loss screen
  - `OvertakeNotification.tsx` - Overtake UI
  - `StreakDisplay.tsx` - Streak counter
  - `TokenCard.tsx` - Token display card
  - `TokenInfoTooltip.tsx` - Token info popup

### Game Hooks
- `src/hooks/useGame.ts` - Core game state management
- `src/hooks/useGameTimer.ts` - Timer hook

### API Routes (Game Logic)
- `src/app/api/game/` - Game API endpoints
  - `start/route.ts` - Start new game
  - `guess/route.ts` - Submit guess
- `src/app/api/leaderboard/` - Leaderboard APIs
  - `route.ts` - Get leaderboard
  - `submit/route.ts` - Submit score
  - `check-overtakes/route.ts` - Check for overtakes
  - `prizepool/route.ts` - Prize pool API (NEW)

### Analytics
- `src/lib/analytics/` - Analytics tracking
  - `index.ts` - Analytics exports
  - `engagement.ts` - Engagement tracking
  - `posthog.ts` - PostHog integration
  - `session.ts` - Session tracking

### Payments (Shared Logic)
- `src/lib/payments/usdc-payment.ts` - USDC payment logic (platform-agnostic)
- `src/app/api/reprieve/verify/route.ts` - Reprieve verification (platform-agnostic)

### Utilities
- `src/lib/branding/` - Branding assets and colors
- `src/lib/feature-flags.ts` - Feature flag system

## Platform-Specific Code

These files differ between mini-app and desktop versions.

### Authentication
- `src/lib/auth/` - Auth implementation
  - `types.ts` - Shared auth types (SHARED)
  - `platforms/farcaster.ts` - Farcaster implementation (MINI-APP)
  - `platforms/privy.ts` - Privy implementation (DESKTOP - to be created)
  - `platforms/index.ts` - Platform factory (SHARED structure, different implementations)
  - `identity-resolver.ts` - Identity resolution (SHARED - works for both)

### Auth Hooks
- `src/hooks/useAuth.ts` - Main auth hook (different implementations)
- `src/hooks/useAuthDev.ts` - Dev auth (MINI-APP only, desktop may have different dev setup)

### Environment Detection
- `src/lib/environment.ts` - Environment detection (different logic per platform)

### Social Sharing
- `src/lib/social/sharing.ts` - Sharing implementation
  - Mini-app: Cast embeds
  - Desktop: Clipboard/social links

### Components
- `src/components/auth/` - Auth UI components (different per platform)
- `src/components/providers/` - Platform providers
  - `MiniAppProvider.tsx` - Mini-app provider (MINI-APP only)
  - PrivyProvider would be in desktop repo

### API Routes (Platform-Specific)
- `src/app/api/auth/route.ts` - Auth verification (different per platform)
- `src/app/.well-known/farcaster.json/route.ts` - Farcaster config (MINI-APP only)

### Landing/Onboarding
- `src/components/landing/` - Landing page components (may differ per platform)

## Code Organization Strategy

### Directory Structure
```
src/
├── lib/
│   ├── auth/
│   │   ├── types.ts (SHARED)
│   │   ├── platforms/
│   │   │   ├── farcaster.ts (MINI-APP)
│   │   │   ├── privy.ts (DESKTOP)
│   │   │   └── index.ts (SHARED structure)
│   │   └── identity-resolver.ts (SHARED)
│   ├── game-core/ (SHARED)
│   ├── data/ (SHARED)
│   ├── leaderboard/ (SHARED)
│   └── redis.ts (SHARED)
├── hooks/
│   ├── useAuth.ts (PLATFORM-SPECIFIC)
│   ├── useGame.ts (SHARED)
│   └── useGameTimer.ts (SHARED)
└── components/
    ├── game/ (SHARED)
    └── auth/ (PLATFORM-SPECIFIC)
```

## Sync Process

When syncing code between repos:

1. **Always sync** shared code files listed above
2. **Never sync** platform-specific files
3. **Review carefully** before syncing files in gray areas (like environment detection)
4. **Test both platforms** after syncing

See `SYNC_GUIDE.md` for detailed sync instructions.

## User ID Normalization

Both platforms normalize user IDs to strings:
- **Mini-app**: `userId = String(fid)` (Farcaster ID)
- **Desktop**: `userId = privyUser.wallet?.address || privyUser.id` (Wallet address or Privy ID)

The identity resolver (`src/lib/auth/identity-resolver.ts`) handles both formats and can resolve:
- ENS names
- Basename (Base name service)
- Farcaster usernames
- Wallet addresses (truncated display)

## Prize Pool System

The prize pool system is **fully shared** and works with both platforms:
- Uses normalized `userId` strings
- Works with existing weekly leaderboard
- Platform-agnostic prize distribution logic
