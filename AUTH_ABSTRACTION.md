# Auth Abstraction Layer

Unified authentication interface for supporting multiple platforms (Farcaster mini-app and Privy desktop).

## Overview

The auth abstraction layer provides a consistent interface for authentication across different platforms while allowing platform-specific implementations.

## Architecture

### Core Types

Located in `src/lib/auth/types.ts`:

```typescript
export interface PlatformUser {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  platform: 'farcaster' | 'privy' | 'anonymous';
  // Platform-specific fields
  fid?: number; // Farcaster ID
  username?: string; // Farcaster username
  walletAddress?: string; // Privy wallet address
}

export interface AuthProvider {
  isReady: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  user: PlatformUser | null;
  token: string | null;
  login: () => Promise<void>;
  logout: () => void;
}
```

### Platform Implementations

#### Farcaster (Mini-App)

Located in `src/lib/auth/platforms/farcaster.ts`:

- Uses Farcaster Quick Auth in production
- Falls back to wallet connection in development
- Converts FID to normalized `userId` string

**Helper Functions:**
- `FarcasterAuthHelpers.checkExistingSession()` - Check for stored session
- `FarcasterAuthHelpers.login()` - Perform login
- `FarcasterAuthHelpers.logout()` - Clear session
- `farcasterUserToPlatformUser()` - Convert to unified format

#### Privy (Desktop)

**To be implemented in desktop repo** at `src/lib/auth/platforms/privy.ts`:

```typescript
export function createPrivyAuthProvider(): AuthProvider {
  // Privy implementation
  // Returns normalized userId (wallet address or Privy ID)
}
```

### Hook Integration

The `useAuth()` hook in `src/hooks/useAuth.ts`:

- Uses Farcaster implementation for mini-app
- Maintains backward compatibility with existing `AuthState` interface
- Adds new `platformUser` and `userId` fields for unified access

**Backward Compatible:**
- Existing code using `fid`, `user`, `token` still works
- New code can use `userId` and `platformUser` for platform-agnostic access

## User ID Normalization

Both platforms normalize to string `userId`:

- **Mini-app**: `userId = String(fid)` (Farcaster ID as string)
- **Desktop**: `userId = privyUser.wallet?.address || privyUser.id` (Wallet address or Privy ID)

This allows shared code to work with both platforms without knowing which auth system is being used.

## Usage Examples

### Platform-Agnostic Code

```typescript
// Works on both platforms
const { userId, platformUser } = useAuth();

if (userId) {
  // Use userId for API calls, leaderboard, etc.
  await submitScore(userId, streak);
}
```

### Platform-Specific Code

```typescript
// Mini-app specific
const { fid, user } = useAuth();
if (fid) {
  // Use FID for Farcaster-specific features
}

// Desktop specific (in desktop repo)
const { walletAddress } = useAuth();
if (walletAddress) {
  // Use wallet for Privy-specific features
}
```

## Migration Guide

### For Mini-App (Current)

No changes required - existing code continues to work. New code can optionally use unified interface.

### For Desktop (To Be Implemented)

1. Create `src/lib/auth/platforms/privy.ts` with Privy implementation
2. Update `src/hooks/useAuth.ts` to use Privy provider when in desktop environment
3. Ensure `userId` normalization matches pattern: `walletAddress || privyId`

## Platform Detection

The `getAuthPlatform()` function in `src/lib/auth/platforms/index.ts` determines which provider to use:

- Mini-app: Returns `'farcaster'`
- Desktop: Should return `'privy'` (to be implemented)
- Fallback: Returns `'farcaster'` for now

## Identity Resolution

The identity resolver (`src/lib/auth/identity-resolver.ts`) works with both platforms:

- Resolves wallet addresses (from Privy)
- Resolves Farcaster usernames (from FID)
- Falls back to truncated addresses for display

## Testing

### Mini-App Testing

```typescript
// Test Farcaster auth
const { isAuthenticated, userId } = useAuth();
expect(isAuthenticated).toBe(true);
expect(userId).toBeTruthy();
```

### Desktop Testing (To Be Implemented)

```typescript
// Test Privy auth
const { isAuthenticated, userId, platformUser } = useAuth();
expect(isAuthenticated).toBe(true);
expect(userId).toMatch(/^0x[a-fA-F0-9]{40}$/); // Wallet address
expect(platformUser?.platform).toBe('privy');
```

## Future Enhancements

- Add more auth providers (WalletConnect, Magic, etc.)
- Support for multiple auth methods per platform
- Auth state persistence across sessions
- Token refresh handling
