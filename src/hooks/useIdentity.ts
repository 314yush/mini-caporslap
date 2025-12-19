'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { User } from '@/lib/game-core/types';
import { 
  getOrCreateUser, 
  updateDisplayName, 
  clearStoredUser,
  isAnonymous 
} from '@/lib/identity';

// Simple store for user state
let cachedUser: User | null = null;
const listeners = new Set<() => void>();

function getUserSnapshot(): User | null {
  if (typeof window === 'undefined') return null;
  if (cachedUser === null) {
    cachedUser = getOrCreateUser();
  }
  return cachedUser;
}

function getServerSnapshot(): User | null {
  return null;
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifyListeners() {
  listeners.forEach(listener => listener());
}

/**
 * Hook for managing user identity
 * Handles anonymous users with localStorage persistence
 */
export function useIdentity() {
  const user = useSyncExternalStore(
    subscribe,
    getUserSnapshot,
    getServerSnapshot
  );
  
  const isLoading = typeof window !== 'undefined' ? false : true;

  // Update display name
  const setDisplayName = useCallback((name: string) => {
    const updated = updateDisplayName(name);
    cachedUser = updated;
    notifyListeners();
  }, []);

  // Reset user (for testing)
  const resetUser = useCallback(() => {
    clearStoredUser();
    cachedUser = getOrCreateUser();
    notifyListeners();
  }, []);

  return {
    user,
    isLoading,
    isAnonymous: user ? isAnonymous(user) : true,
    userId: user?.userId || '',
    displayName: user?.displayName || 'Anonymous',
    setDisplayName,
    resetUser,
  };
}
