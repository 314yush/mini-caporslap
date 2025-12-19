# Privy Auth Implementation Template

**For Desktop Repo**: https://github.com/314yush/clap-or-slap

This is a template for implementing Privy auth in the desktop repo. Copy and adapt as needed.

## File: `src/lib/auth/platforms/privy.ts`

```typescript
/**
 * Privy Auth Platform Implementation
 * Handles Privy authentication for desktop/web environment
 */

'use client';

import type { AuthProvider, PlatformUser } from '../types';

// Privy user type (adjust based on your Privy version)
interface PrivyUser {
  id: string;
  wallet?: {
    address: string;
    chainId?: string;
    walletClientType?: string;
  };
  email?: {
    address: string;
  };
  google?: {
    email: string;
    name?: string;
    picture?: string;
  };
  // Add other Privy user fields as needed
}

/**
 * Converts Privy user to PlatformUser
 */
export function privyUserToPlatformUser(privyUser: PrivyUser): PlatformUser {
  // Normalize userId: prefer wallet address, fallback to Privy ID
  const userId = privyUser.wallet?.address || privyUser.id;
  
  // Get display name
  let displayName = 'User';
  if (privyUser.wallet?.address) {
    // Use ENS if available, otherwise truncated address
    displayName = privyUser.wallet.address.slice(0, 6) + '...' + privyUser.wallet.address.slice(-4);
  } else if (privyUser.google?.name) {
    displayName = privyUser.google.name;
  } else if (privyUser.email?.address) {
    displayName = privyUser.email.address.split('@')[0];
  }
  
  // Get avatar
  const avatarUrl = privyUser.google?.picture || undefined;
  
  return {
    userId,
    displayName,
    avatarUrl,
    platform: 'privy',
    walletAddress: privyUser.wallet?.address,
  };
}

/**
 * Privy-specific auth logic helpers
 */
export const PrivyAuthHelpers = {
  /**
   * Check for existing Privy session
   * Privy handles this internally, so this mainly checks if user is authenticated
   */
  async checkExistingSession(privyReady: boolean, privyAuthenticated: boolean, privyUser: PrivyUser | null) {
    if (!privyReady) {
      return null;
    }
    
    if (privyAuthenticated && privyUser) {
      return {
        user: privyUser,
        token: null, // Privy doesn't use tokens in the same way
      };
    }
    
    return null;
  },

  /**
   * Login using Privy
   */
  async login(privyLogin: () => Promise<void>) {
    await privyLogin();
  },

  /**
   * Logout
   */
  logout(privyLogout: () => void) {
    privyLogout();
  },
};
```

## File: `src/hooks/useAuth.ts` (Desktop Version)

```typescript
'use client';

import { usePrivy } from '@privy-io/react-auth';
import { privyUserToPlatformUser, PrivyAuthHelpers } from '@/lib/auth/platforms/privy';
import type { PlatformUser } from '@/lib/auth/types';

// Re-export for backward compatibility
export interface PrivyUser {
  id: string;
  wallet?: {
    address: string;
  };
  email?: {
    address: string;
  };
  // ... other Privy fields
}

export interface AuthState {
  // Connection state
  isReady: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // User info (backward compatible)
  userId: string | null;
  platformUser: PlatformUser | null;
  
  // Legacy fields (for backward compatibility)
  fid: number | null; // Always null for Privy
  user: PrivyUser | null; // Privy user object
  token: string | null; // Always null for Privy
  
  // Auth methods
  login: () => Promise<void>;
  logout: () => void;
}

export function useAuth(): AuthState {
  const {
    ready,
    authenticated,
    user: privyUser,
    login: privyLogin,
    logout: privyLogout,
  } = usePrivy();

  // Convert Privy user to PlatformUser
  const platformUser: PlatformUser | null = privyUser
    ? privyUserToPlatformUser(privyUser)
    : null;

  const userId = platformUser?.userId || null;

  // Login wrapper
  const login = async () => {
    await PrivyAuthHelpers.login(privyLogin);
  };

  // Logout wrapper
  const logout = () => {
    PrivyAuthHelpers.logout(privyLogout);
  };

  return {
    isReady: ready,
    isAuthenticated: authenticated,
    isLoading: false, // Privy handles loading internally
    userId,
    platformUser,
    // Backward compatibility fields
    fid: null, // Not applicable for Privy
    user: privyUser as PrivyUser | null,
    token: null, // Privy doesn't use tokens
    login,
    logout,
  };
}

/**
 * Hook to get just the user ID (for API calls)
 */
export function useUserId(): string {
  const { userId } = useAuth();
  return userId || '';
}
```

## Integration Steps

### 1. Install Privy (if not already installed)

```bash
npm install @privy-io/react-auth
```

### 2. Set up PrivyProvider in your app

In `src/app/layout.tsx` or your root component:

```typescript
import { PrivyProvider } from '@privy-io/react-auth';

export default function RootLayout({ children }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        loginMethods: ['wallet', 'email', 'google'],
        appearance: {
          theme: 'dark',
          // Customize as needed
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
```

### 3. Environment Variables

Add to `.env`:

```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
```

### 4. Update Components

Update any components that use auth to use the unified interface:

```typescript
// Before (Privy-specific)
const { authenticated, user } = usePrivy();
const address = user?.wallet?.address;

// After (Platform-agnostic)
const { isAuthenticated, userId, platformUser } = useAuth();
// userId works on both platforms!
```

## Key Points

1. **User ID Normalization**: 
   - Desktop: `privyUser.wallet?.address || privyUser.id`
   - This matches the pattern used in mini-app (FID as string)

2. **Backward Compatibility**: 
   - Keep `fid`, `user`, `token` fields (even if null/not applicable)
   - This allows existing code to work without changes

3. **Platform Detection**: 
   - Update `src/lib/auth/platforms/index.ts` to return `'privy'` for desktop

4. **Testing**: 
   - Test wallet connection
   - Test email login (if enabled)
   - Verify `userId` is normalized correctly
   - Verify leaderboard submissions work

## Differences from Farcaster Implementation

| Aspect | Farcaster (Mini-App) | Privy (Desktop) |
|--------|---------------------|-----------------|
| User ID | `String(fid)` | `wallet?.address \|\| id` |
| Token | JWT from Quick Auth | None (Privy handles auth) |
| Session | sessionStorage | Privy handles internally |
| Login | `sdk.quickAuth.getToken()` | `privyLogin()` |
| User Object | `FarcasterUser` | `PrivyUser` |

## Troubleshooting

### Issue: userId is not wallet address
**Solution**: Ensure `privyUser.wallet?.address` is checked first in normalization

### Issue: Components not updating on auth change
**Solution**: Ensure PrivyProvider wraps your app and `usePrivy()` hook is used correctly

### Issue: TypeScript errors
**Solution**: Install Privy types: `npm install --save-dev @types/privy-io-react-auth` (if available) or define types manually

## Next Steps

After implementing:

1. Test auth flow end-to-end
2. Test game with Privy auth
3. Test leaderboard submission
4. Verify userId normalization works
5. Start syncing features using `SYNC_GUIDE.md`
