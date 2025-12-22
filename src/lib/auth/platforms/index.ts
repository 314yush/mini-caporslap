/**
 * Auth Platform Factory
 * Selects the appropriate auth provider based on environment
 */

import { detectEnvironment } from '@/lib/environment';
import type { AuthProvider } from '../types';

/**
 * Determines which auth platform to use
 * - Mini-app: Farcaster (with Privy fallback if Quick Auth fails)
 * - Web: Privy
 * - Fallback: Anonymous
 */
export function getAuthPlatform(): 'farcaster' | 'privy' | 'anonymous' {
  const env = detectEnvironment();
  
  if (env === 'miniapp') {
    return 'farcaster';
  }
  
  // Web environment uses Privy
  return 'privy';
}

/**
 * Platform-specific auth provider exports
 */
export { FarcasterAuthHelpers, farcasterUserToPlatformUser } from './farcaster';
export { PrivyAuthHelpers, privyUserToPlatformUser, type PrivyUser } from './privy';
