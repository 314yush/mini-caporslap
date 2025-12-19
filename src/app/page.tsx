'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks';
import { GameScreen } from '@/components/game';
import { LandingPage } from '@/components/landing';

export default function Home() {
  const { isReady, isAuthenticated, login, isLoading, fid, user } = useAuth();
  
  // Debug logging for auth state changes
  useEffect(() => {
    console.log('[Page] Auth state changed:', {
      isReady,
      isAuthenticated,
      isLoading,
      fid,
      user: user ? { fid: user.fid, username: user.username } : null,
    });
  }, [isReady, isAuthenticated, isLoading, fid, user]);
  
  // Show loading while initializing
  if (!isReady) {
    console.log('[Page] Rendering: Loading screen (isReady=false)');
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Show landing page if not authenticated
  if (!isAuthenticated) {
    console.log('[Page] Rendering: Landing page (isAuthenticated=false)');
    return <LandingPage onLogin={login} isLoading={isLoading} />;
  }
  
  // Show game if authenticated
  console.log('[Page] Rendering: GameScreen (isAuthenticated=true, fid=' + fid + ')');
  return <GameScreen />;
}
