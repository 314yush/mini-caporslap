'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

interface UserMenuProps {
  className?: string;
}

export function UserMenu({ className = '' }: UserMenuProps) {
  const { logout, user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Don't show menu if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }
  
  const displayName = user.username 
    ? `@${user.username}` 
    : user.displayName || `FID: ${user.fid}`;
  const avatarUrl = user.pfpUrl;
  const initial = (user.username || user.displayName || 'U').charAt(0).toUpperCase();
  
  return (
    <div className={`relative ${className}`} ref={menuRef}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center gap-2 
          px-3 py-2 rounded-xl
          bg-zinc-800/50 hover:bg-zinc-700/50
          border border-zinc-700/50 hover:border-zinc-600/50
          transition-all duration-200
        "
      >
        {/* Avatar */}
        <div className="relative w-7 h-7 rounded-full overflow-hidden bg-zinc-700 shrink-0">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white">
              {initial}
            </div>
          )}
        </div>
        
        {/* Name */}
        <span className="text-sm font-medium text-white max-w-[120px] truncate">
          {displayName}
        </span>
        
        {/* Dropdown arrow */}
        <svg 
          className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {/* Dropdown menu */}
      {isOpen && (
        <div 
          className="
            absolute right-0 mt-2 w-48
            bg-zinc-900 border border-zinc-700
            rounded-xl shadow-lg shadow-black/50
            overflow-hidden z-50
            animate-in fade-in slide-in-from-top-2 duration-200
          "
        >
          {/* User info header */}
          <div className="px-4 py-3 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-700 shrink-0">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={displayName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg font-bold text-white">
                    {initial}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {displayName}
                </p>
                <p className="text-xs text-zinc-500">
                  FID: {user.fid}
                </p>
              </div>
            </div>
          </div>
          
          {/* Menu items */}
          <div className="py-1">
            <Link
              href="/leaderboard"
              onClick={() => setIsOpen(false)}
              className="
                flex items-center gap-3 px-4 py-2.5
                text-sm text-zinc-300 hover:text-white
                hover:bg-zinc-800/50
                transition-colors
              "
            >
              <span className="text-lg">🏆</span>
              Leaderboard
            </Link>
            
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="
                w-full flex items-center gap-3 px-4 py-2.5
                text-sm text-zinc-300 hover:text-white
                hover:bg-zinc-800/50
                transition-colors
              "
            >
              <span className="text-lg">👋</span>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact user display (no dropdown)
 */
export function UserDisplay({ className = '' }: { className?: string }) {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated || !user) {
    return null;
  }
  
  const displayName = user.username 
    ? `@${user.username}` 
    : user.displayName || `FID: ${user.fid}`;
  const avatarUrl = user.pfpUrl;
  const initial = (user.username || user.displayName || 'U').charAt(0).toUpperCase();
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative w-6 h-6 rounded-full overflow-hidden bg-zinc-700 shrink-0">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
            {initial}
          </div>
        )}
      </div>
      <span className="text-sm text-white truncate max-w-[100px]">
        {displayName}
      </span>
    </div>
  );
}






