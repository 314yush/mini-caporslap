'use client';

import { useAuth } from '@/hooks/useAuth';

interface ConnectButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ConnectButton({ className = '', size = 'lg' }: ConnectButtonProps) {
  const { isReady, isAuthenticated, isLoading, user, login, logout } = useAuth();
  
  const sizeClasses = {
    sm: 'py-2 px-4 text-sm',
    md: 'py-3 px-6 text-base',
    lg: 'py-4 px-8 text-lg',
  };
  
  // Show loading state while initializing
  if (!isReady || isLoading) {
    return (
      <button
        disabled
        className={`
          ${sizeClasses[size]}
          rounded-2xl font-bold
          bg-zinc-700 text-zinc-400
          cursor-not-allowed
          ${className}
        `}
      >
        {isLoading ? 'Signing in...' : 'Loading...'}
      </button>
    );
  }
  
  // User is authenticated - show their info and logout option
  if (isAuthenticated && user) {
    const displayName = user.username 
      ? `@${user.username}` 
      : user.displayName || `FID: ${user.fid}`;
    
    return (
      <button
        onClick={logout}
        className={`
          ${sizeClasses[size]}
          rounded-2xl font-bold
          bg-zinc-800 hover:bg-zinc-700
          border border-zinc-600 hover:border-zinc-500
          text-white
          transition-all duration-200
          ${className}
        `}
      >
        {displayName}
      </button>
    );
  }
  
  // Not authenticated - show sign in button
  const isDevelopment = typeof window !== 'undefined' && 
    !window.location.href.includes('base.org') && 
    !window.location.href.includes('farcaster.xyz');
  
  return (
    <button
      onClick={login}
      className={`
        ${sizeClasses[size]}
        rounded-2xl font-bold
        bg-gradient-to-r from-amber-500 to-orange-500
        hover:from-amber-400 hover:to-orange-400
        text-white shadow-lg shadow-amber-500/25
        transform transition-all duration-200
        hover:scale-105 active:scale-95
        ${className}
      `}
    >
      {isDevelopment ? 'Connect Wallet (Dev)' : 'Sign In with Farcaster'}
    </button>
  );
}
