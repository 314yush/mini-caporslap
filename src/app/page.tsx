'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks';
import { GameScreen } from '@/components/game';
import { LandingPage, OnboardingModal } from '@/components/landing';

const ONBOARDING_SEEN_KEY = 'caporslap_onboarding_seen';

export default function Home() {
  const { isReady, isAuthenticated, login, isLoading, fid, user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  
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

  // Check if user has seen onboarding after authentication
  useEffect(() => {
    if (isReady && isAuthenticated && !onboardingChecked) {
      // Defer state updates to avoid synchronous setState in effect
      queueMicrotask(() => {
        const hasSeenOnboarding = localStorage.getItem(ONBOARDING_SEEN_KEY) === 'true';
        setShowOnboarding(!hasSeenOnboarding);
        setOnboardingChecked(true);
      });
    }
  }, [isReady, isAuthenticated, onboardingChecked]);

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_SEEN_KEY, 'true');
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    localStorage.setItem(ONBOARDING_SEEN_KEY, 'true');
    setShowOnboarding(false);
  };
  
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
  
  // Show onboarding modal for first-time users
  if (showOnboarding) {
    console.log('[Page] Rendering: Onboarding modal');
    return (
      <div className="min-h-screen bg-black">
        <OnboardingModal
          isOpen={showOnboarding}
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      </div>
    );
  }
  
  // Show game if authenticated
  console.log('[Page] Rendering: GameScreen (isAuthenticated=true, fid=' + fid + ')');
  return <GameScreen />;
}
