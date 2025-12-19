/**
 * Auth Platform Factory
 * Selects the appropriate auth provider based on environment
 */

import { detectEnvironment } from '@/lib/environment';
import type { AuthProvider } from '../types';

/**
 * Determines which auth platform to use
 * - Mini-app: Farcaster
 * - Desktop/Web: Will be Privy (in desktop repo)
 * - Fallback: Anonymous
 */
export function getAuthPlatform(): 'farcaster' | 'privy' | 'anonymous' {
  const env = detectEnvironment();
  
  if (env === 'miniapp') {
    return 'farcaster';
  }
  
  // Desktop version will use Privy
  // For now, we default to farcaster for web (dev mode)
  // In desktop repo, this will return 'privy'
  return 'farcaster';
}

/**
 * Platform-specific auth provider exports
 * Desktop repo will implement createPrivyAuthProvider
 */
export { FarcasterAuthHelpers, farcasterUserToPlatformUser } from './farcaster';
