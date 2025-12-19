'use client';

import Image from 'next/image';
import { assets } from '@/lib/branding';

interface LandingPageProps {
  onLogin: () => Promise<void>;
  isLoading?: boolean;
}

export function LandingPage({ onLogin, isLoading = false }: LandingPageProps) {
  const handleLogin = async () => {
    try {
      await onLogin();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-black relative py-8 pb-16 md:py-12 md:pb-20 overflow-x-hidden">
      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center text-center w-full max-w-6xl">
        {/* Logo - Smaller on mobile */}
        <div className="mb-6 md:mb-8 w-full">
          <div className="relative w-full max-w-[200px] md:max-w-[280px] mx-auto">
            <Image
              src={assets.logos.wordmark}
              alt="CapOrSlap"
              width={500}
              height={200}
              priority
              className="w-full h-auto"
            />
          </div>
        </div>
        
        {/* Tagline + Value Props */}
        <div className="mb-8 md:mb-12 w-full">
          <p className="text-lg md:text-xl text-white mb-2">
            Guess the market cap.
          </p>
          <p className="text-2xl md:text-3xl font-black text-yellow-400 leading-tight mb-4 md:mb-6">
            BEAT YOUR STREAK.
          </p>
          
          {/* Value Propositions */}
          <div className="flex flex-col gap-3 md:gap-4 px-4">
            <div className="flex items-center justify-center gap-2 text-sm md:text-base text-zinc-300">
              <span className="text-yellow-400">⚡</span>
              <span>Prove how degen you are</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm md:text-base text-zinc-300">
              <span className="text-orange-400">🏆</span>
              <span>Weekly prizepool coming soon - top players win</span>
            </div>
          </div>
        </div>
        
        {/* CTA Button - More Prominent, Higher on Page */}
        <div className="flex flex-col items-center gap-3 w-full mb-8 md:mb-12">
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className={`
              w-full max-w-[320px]
              min-h-[44px]
              py-3 px-8
              text-base md:text-lg
              rounded-2xl font-bold
              bg-linear-to-r from-amber-500 to-orange-500
              hover:from-amber-400 hover:to-orange-400
              text-white shadow-lg shadow-amber-500/25
              transform transition-all duration-200
              active:scale-95
              disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
              flex items-center justify-center gap-2
            `}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              'Start Playing'
            )}
          </button>
          <p className="text-xs md:text-sm text-zinc-500">
            Sign in with your Farcaster account to compete
          </p>
        </div>
        
        {/* Main Character Image - Optimized for Mobile */}
        <div className="w-full mb-8 md:mb-12 flex justify-center">
          <div className="relative w-full max-w-full md:max-w-2xl">
            <div className="relative w-full">
              <Image
                src="/images/branding/characters/characters.png"
                alt="Crypto characters ready to battle"
                width={1200}
                height={600}
                className="w-full h-auto object-contain"
                priority
                sizes="100vw"
                style={{ paddingTop: '20px', paddingBottom: '20px', margin: 0, display: 'block' }}
              />
            </div>
          </div>
        </div>
        
        {/* Comparison Cards - Simplified for Mobile */}
        <div className="w-full mb-8 md:mb-12">
          <div className="relative mx-auto max-w-4xl flex flex-col">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-x-4 -inset-y-4 md:-inset-x-8 md:-inset-y-6 bg-linear-to-r from-yellow-400/10 via-white/5 to-fuchsia-500/10 blur-3xl opacity-70"
            />

            <div className="relative flex flex-row items-stretch justify-center gap-2 md:gap-4">
              {/* ETH Card */}
              <ComparisonCard token="ETH" marketCap="$2.1T" showMarketCap={true} />

              {/* VS */}
              <div className="flex items-center justify-center px-1 md:px-2">
                <div className="relative">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full bg-linear-to-r from-yellow-400/35 via-white/15 to-fuchsia-500/35 blur-lg"
                  />
                  <div className="relative rounded-full border border-white/15 bg-white/5 px-3 py-1.5 md:px-4 md:py-2 backdrop-blur-sm">
                    <span className="block text-sm md:text-lg font-black tracking-widest text-white">
                      VS
                    </span>
                  </div>
                </div>
              </div>

              {/* SOL Card */}
              <ComparisonCard token="SOL" marketCap="?" showMarketCap={false} />
            </div>
          </div>
        </div>
        
        {/* Minimal Features */}
        <div className="w-full mb-8 md:mb-12">
          <p className="text-xs md:text-sm text-zinc-500 text-center">
            500+ tokens • Infinite streaks • Global leaderboard
          </p>
        </div>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-4 md:bottom-6 left-0 right-0 text-center text-[10px] md:text-xs text-zinc-600 px-4">
        Built for degens • Data from CoinGecko
      </div>
    </div>
  );
}

// Comparison Card Component - Mobile-First
function ComparisonCard({ 
  token, 
  marketCap, 
  showMarketCap 
}: { 
  token: string; 
  marketCap: string; 
  showMarketCap: boolean;
}) {
  const theme =
    token === 'ETH'
      ? {
          border: 'bg-linear-to-br from-violet-500/50 via-white/10 to-fuchsia-500/40',
          dot: 'bg-violet-400',
          tokenText: 'text-violet-200',
          capText: 'text-white',
        }
      : token === 'SOL'
        ? {
            border: 'bg-linear-to-br from-emerald-400/50 via-cyan-400/20 to-fuchsia-500/45',
            dot: 'bg-linear-to-r from-emerald-400 to-fuchsia-500',
            tokenText: 'text-emerald-200',
            capText: 'text-white',
          }
        : {
            border: 'bg-linear-to-br from-white/25 via-white/10 to-white/20',
            dot: 'bg-white/70',
            tokenText: 'text-white',
            capText: 'text-white',
          };

  return (
    <div className={`w-full max-w-[120px] md:max-w-[165px] ${theme.border} rounded-xl md:rounded-2xl p-px shadow-[0_0_0_1px_rgba(255,255,255,0.06)]`}>
      <div className="h-full rounded-xl md:rounded-2xl bg-black/50 backdrop-blur-sm px-3 py-3 md:px-4 md:py-4 border border-white/10 transition-all duration-300">
        {/* Token header */}
        <div className="flex items-center justify-center gap-1.5 md:gap-2 mb-2 md:mb-2.5">
          <span className={`h-2 w-2 md:h-2.5 md:w-2.5 rounded-full ${theme.dot}`} />
          <span className={`text-xs md:text-base font-black tracking-wider ${theme.tokenText}`}>
            {token}
          </span>
        </div>

        {/* Market cap */}
        <div className="text-[9px] md:text-xs uppercase tracking-wider text-zinc-500 text-center mb-1">
          Market Cap
        </div>
        <div
          className={`text-base md:text-xl lg:text-2xl font-black tabular-nums text-center ${theme.capText} ${
            showMarketCap ? '' : 'animate-pulse'
          }`}
        >
          {marketCap}
        </div>
      </div>
    </div>
  );
}
