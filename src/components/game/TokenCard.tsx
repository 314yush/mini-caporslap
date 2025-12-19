'use client';

import { Token } from '@/lib/game-core/types';
import { formatMarketCap } from '@/lib/game-core/comparison';
import Image from 'next/image';

interface TokenCardProps {
  token: Token;
  showMarketCap?: boolean;
}

export function TokenCard({ token, showMarketCap = true }: TokenCardProps) {
  return (
    <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800">
      {/* Token Logo */}
      <div className="relative w-20 h-20 rounded-full overflow-hidden bg-zinc-800 ring-2 ring-zinc-700">
        <Image
          src={token.logoUrl}
          alt={token.symbol}
          fill
          sizes="80px"
          className="object-cover"
          priority
          onError={(e) => {
            // Fallback to placeholder
            const target = e.target as HTMLImageElement;
            target.src = `https://ui-avatars.com/api/?name=${token.symbol}&background=random&size=128`;
          }}
        />
      </div>
      
      {/* Token Info */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          {token.symbol}
        </h2>
        <p className="text-sm text-zinc-400 mt-1">{token.name}</p>
      </div>
      
      {/* Market Cap */}
      {showMarketCap && (
        <div className="px-4 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700">
          <span className="text-xl font-mono font-bold text-emerald-400">
            {formatMarketCap(token.marketCap)}
          </span>
        </div>
      )}
    </div>
  );
}

