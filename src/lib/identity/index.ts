import { v4 as uuidv4 } from 'uuid';
import { User, UserType } from '../game-core/types';

/**
 * Identity system for CapOrSlap
 * Phase 0: Anonymous users with localStorage persistence
 * Phase 1: Wallet connect and Farcaster FID
 */

const STORAGE_KEY = 'caporslap_user';
const ANON_NAME_PREFIXES = [
  'Degen', 'Anon', 'Ape', 'Bull', 'Bear', 'Diamond', 'Paper', 
  'Moon', 'Whale', 'Shrimp', 'Chad', 'Based', 'Fren', 'Ser'
];

/**
 * Generates a random anonymous display name
 * @returns Random name like "Degen_4829"
 */
function generateAnonName(): string {
  const prefix = ANON_NAME_PREFIXES[Math.floor(Math.random() * ANON_NAME_PREFIXES.length)];
  const suffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}_${suffix}`;
}

/**
 * Creates a new anonymous user
 * @returns New User object
 */
export function createAnonymousUser(): User {
  return {
    userId: uuidv4(),
    userType: 'anon' as UserType,
    displayName: generateAnonName(),
  };
}

/**
 * Gets the current user from localStorage, creating one if needed
 * Only works on client side
 * @returns User object
 */
export function getOrCreateUser(): User {
  if (typeof window === 'undefined') {
    // Server-side, return a placeholder
    return createAnonymousUser();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const user = JSON.parse(stored) as User;
      // Validate the stored user has required fields
      if (user.userId && user.userType && user.displayName) {
        return user;
      }
    }
  } catch (error) {
    console.error('Error reading user from localStorage:', error);
  }

  // Create new user
  const newUser = createAnonymousUser();
  saveUser(newUser);
  return newUser;
}

/**
 * Saves user to localStorage
 * @param user - User to save
 */
export function saveUser(user: User): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user to localStorage:', error);
  }
}

/**
 * Updates the user's display name
 * @param newName - New display name
 * @returns Updated user
 */
export function updateDisplayName(newName: string): User {
  const user = getOrCreateUser();
  user.displayName = newName;
  saveUser(user);
  return user;
}

/**
 * Clears the stored user (for testing/reset)
 */
export function clearStoredUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Upgrades an anonymous user to a wallet user
 * @param walletAddress - Wallet address
 * @param ensName - Optional ENS name
 * @returns Upgraded user
 */
export function upgradeToWalletUser(
  walletAddress: string,
  ensName?: string
): User {
  const currentUser = getOrCreateUser();
  
  const upgradedUser: User = {
    ...currentUser,
    userType: 'wallet' as UserType,
    displayName: ensName || `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
  };
  
  saveUser(upgradedUser);
  return upgradedUser;
}

/**
 * Checks if user is anonymous
 * @param user - User to check
 * @returns Whether user is anonymous
 */
export function isAnonymous(user: User): boolean {
  return user.userType === 'anon';
}

/**
 * Gets user ID for server requests
 * @returns User ID string
 */
export function getUserId(): string {
  return getOrCreateUser().userId;
}



