'use client';

import { usePrivy } from '@privy-io/react-auth';

interface ConnectButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ConnectButton({ className = '', size = 'lg' }: ConnectButtonProps) {
  const { ready, authenticated, login, logout, user } = usePrivy();
  
  const sizeClasses = {
    sm: 'py-2 px-4 text-sm',
    md: 'py-3 px-6 text-base',
    lg: 'py-4 px-8 text-lg',
  };
  
  // Show loading state while Privy initializes
  if (!ready) {
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
        Loading...
      </button>
    );
  }
  
  // User is connected - show their info and logout option
  if (authenticated && user) {
    const displayAddress = user.wallet?.address 
      ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`
      : 'Connected';
    
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
        {displayAddress}
      </button>
    );
  }
  
  // Not connected - show connect button
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
      Connect Wallet
    </button>
  );
}

// Simpler version for when Privy is not configured
export function GuestPlayButton({ 
  onClick, 
  className = '' 
}: { 
  onClick: () => void; 
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        py-2 px-4 text-sm
        text-zinc-400 hover:text-white
        underline underline-offset-4
        transition-colors
        ${className}
      `}
    >
      or play as guest
    </button>
  );
}


