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
    <div className="min-h-screen flex flex-col items-center justify-center px-0 sm:px-4 md:px-6 bg-black relative py-16 pb-20 sm:py-20 sm:pb-24 md:py-24 md:pb-6 overflow-x-hidden">
      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center text-center w-full max-w-6xl px-0">
        {/* Logo */}
        <div className="mb-4 sm:mb-6 md:mb-8 lg:mb-12 w-full px-2 sm:px-0">
          <div className="relative w-full max-w-[260px] sm:max-w-sm md:max-w-lg mx-auto">
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
        
        {/* Tagline */}
        <div className="mb-4 sm:mb-6 md:mb-8 lg:mb-12 w-full px-2 sm:px-4">
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white mb-1 sm:mb-2">
            Guess the market cap.
          </p>
          <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-yellow-400 leading-tight px-1">
            BEAT YOUR STREAK.
          </p>
        </div>
        
        {/* Main Character Image - Hero */}
        <div className="w-full mb-4 sm:mb-6 md:mb-8 lg:mb-12 flex justify-center px-0">
          <div className="relative w-full max-w-full sm:max-w-2xl md:max-w-4xl" style={{ padding: 0 }}>
            <div className="relative w-full" style={{ aspectRatio: 'auto', paddingBottom: 0 }}>
              <Image
                src="/images/branding/characters/characters.png"
                alt="Crypto characters ready to battle"
                width={1200}
                height={600}
                className="w-full h-auto object-contain"
                priority
                sizes="100vw"
                style={{ paddingTop: '33px', paddingBottom: '33px', margin: 0, display: 'block' }}
              />
            </div>
          </div>
        </div>
        
        {/* CTA Button */}
        <div className="flex flex-col items-center gap-2 sm:gap-3 w-full mb-4 sm:mb-6 md:mb-8 lg:mb-12 px-2 sm:px-4">
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className={`
              w-full max-w-[280px] sm:max-w-xs md:max-w-sm
              py-4 px-8 text-lg
              rounded-2xl font-bold
              bg-gradient-to-r from-amber-500 to-orange-500
              hover:from-amber-400 hover:to-orange-400
              text-white shadow-lg shadow-amber-500/25
              transform transition-all duration-200
              hover:scale-105 active:scale-95
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
              flex items-center justify-center gap-2
            `}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In to Play'
            )}
          </button>
          <p className="text-xs text-zinc-500">
            Sign in with your Farcaster account
          </p>
        </div>
        
        {/* Comparison Cards */}
        <div className="w-full mb-4 sm:mb-6 md:mb-8 lg:mb-12 px-2 sm:px-4">
          <div className="relative mx-auto max-w-4xl flex flex-col">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-x-8 -inset-y-6 bg-linear-to-r from-yellow-400/10 via-white/5 to-fuchsia-500/10 blur-3xl opacity-70"
            />

            <div className="relative flex flex-row items-stretch justify-center gap-3 sm:gap-4 md:gap-6">
              {/* ETH Card */}
              <ComparisonCard token="ETH" marketCap="$2.1T" showMarketCap={true} />

              {/* VS */}
              <div className="flex items-center justify-center px-1 sm:px-2">
                <div className="relative">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full bg-linear-to-r from-yellow-400/35 via-white/15 to-fuchsia-500/35 blur-lg"
                  />
                  <div className="relative rounded-full border border-white/15 bg-white/5 px-3 py-1.5 sm:px-4 sm:py-2 backdrop-blur-sm">
                    <span className="block text-base sm:text-lg md:text-xl font-black tracking-widest text-white">
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
        
        {/* Stats */}
        <div className="flex flex-row items-center justify-center gap-3 sm:gap-4 md:gap-6 lg:gap-8 mb-6 sm:mb-8 px-2 sm:px-4 w-full">
          <div className="flex-1 max-w-[140px] sm:max-w-[160px] md:max-w-[180px] rounded-xl sm:rounded-2xl py-4 sm:py-5 md:py-6 px-3 sm:px-4 md:px-5 border border-white/10 bg-linear-to-b from-white/5 to-white/0 backdrop-blur-sm hover:border-white/20 hover:from-white/10 hover:to-white/5 transition-all duration-300 group">
            <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-1 sm:mb-1.5 md:mb-2 group-hover:scale-110 transition-transform duration-300">80+</div>
            <div className="text-[10px] sm:text-xs md:text-sm font-medium text-zinc-400 uppercase tracking-wider">Tokens</div>
          </div>
          <div className="flex-1 max-w-[140px] sm:max-w-[160px] md:max-w-[180px] rounded-xl sm:rounded-2xl py-4 sm:py-5 md:py-6 px-3 sm:px-4 md:px-5 border border-yellow-400/20 bg-linear-to-b from-yellow-400/10 to-yellow-400/0 backdrop-blur-sm hover:border-yellow-400/30 hover:from-yellow-400/15 hover:to-yellow-400/5 transition-all duration-300 group">
            <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-yellow-400 mb-1 sm:mb-1.5 md:mb-2 group-hover:scale-110 transition-transform duration-300">∞</div>
            <div className="text-[10px] sm:text-xs md:text-sm font-medium text-zinc-400 uppercase tracking-wider">Streaks</div>
          </div>
          <div className="flex-1 max-w-[140px] sm:max-w-[160px] md:max-w-[180px] rounded-xl sm:rounded-2xl py-4 sm:py-5 md:py-6 px-3 sm:px-4 md:px-5 border border-orange-500/20 bg-linear-to-b from-orange-500/10 to-orange-500/0 backdrop-blur-sm hover:border-orange-500/30 hover:from-orange-500/15 hover:to-orange-500/5 transition-all duration-300 group">
            <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-1 sm:mb-1.5 md:mb-2 group-hover:scale-110 transition-transform duration-300">🔥</div>
            <div className="text-[10px] sm:text-xs md:text-sm font-medium text-zinc-400 uppercase tracking-wider">Compete</div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-3 sm:bottom-4 md:bottom-6 left-0 right-0 text-center text-[9px] sm:text-[10px] md:text-xs text-zinc-600 px-2 sm:px-4">
        Built for degens • Data from CoinGecko
      </div>
    </div>
  );
}

// Comparison Card Component - Simplified
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
    <div className={`w-full max-w-[165px] sm:max-w-[190px] md:max-w-[220px] ${theme.border} rounded-2xl p-px shadow-[0_0_0_1px_rgba(255,255,255,0.06)]`}>
      <div className="h-full rounded-2xl bg-black/50 backdrop-blur-sm px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 border border-white/10 hover:border-white/20 hover:bg-black/40 transition-all duration-300 hover:-translate-y-0.5">
        {/* Token header */}
        <div className="flex items-center justify-center gap-2 mb-2.5 sm:mb-3">
          <span className={`h-2.5 w-2.5 rounded-full ${theme.dot}`} />
          <span className={`text-sm sm:text-base md:text-lg font-black tracking-wider ${theme.tokenText}`}>
            {token}
          </span>
        </div>

        {/* Market cap */}
        <div className="text-[10px] sm:text-xs uppercase tracking-wider text-zinc-500 text-center mb-1">
          Market Cap
        </div>
        <div
          className={`text-lg sm:text-xl md:text-2xl lg:text-3xl font-black tabular-nums text-center ${theme.capText} ${
            showMarketCap ? '' : 'animate-pulse'
          }`}
        >
          {marketCap}
        </div>
      </div>
    </div>
  );
}
