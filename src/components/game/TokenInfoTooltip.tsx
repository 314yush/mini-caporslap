'use client';

import { useState, useRef, useEffect } from 'react';
import { Token } from '@/lib/game-core/types';
import { getCategoryDisplayName, TokenCategory } from '@/lib/data/token-categories';

interface TokenInfoTooltipProps {
  token: Token;
  children: React.ReactNode;
}

export function TokenInfoTooltip({ token, children }: TokenInfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        tooltipRef.current && 
        !tooltipRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const categoryName = token.category && token.category !== 'unknown'
    ? getCategoryDisplayName(token.category as TokenCategory)
    : null;

  return (
    <div className="relative inline-block">
      {/* Trigger */}
      <div
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer hover:opacity-80 transition-opacity"
      >
        {children}
      </div>

      {/* Tooltip */}
      {isOpen && (
        <div
          ref={tooltipRef}
          className="
            absolute z-50 
            left-1/2 -translate-x-1/2
            top-full mt-2
            w-72 max-w-[90vw]
            animate-fade-in
          "
        >
          {/* Arrow */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-zinc-800 rotate-45 border-l border-t border-zinc-700" />
          
          {/* Content */}
          <div className="relative bg-zinc-800 border border-zinc-700 rounded-xl p-4 shadow-xl">
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-zinc-700 overflow-hidden shrink-0">
                <img
                  src={token.logoUrl}
                  alt={token.symbol}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=${token.symbol}&background=random&size=80`;
                  }}
                />
              </div>
              <div>
                <h4 className="font-bold text-white text-lg">{token.name}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400 text-sm">${token.symbol}</span>
                  {categoryName && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-300">
                      {categoryName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {token.description ? (
              <p className="text-zinc-300 text-sm leading-relaxed">
                {token.description}
              </p>
            ) : (
              <p className="text-zinc-500 text-sm italic">
                No description available
              </p>
            )}

            {/* Chain info */}
            <div className="mt-3 pt-3 border-t border-zinc-700">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Chain: {formatChainName(token.chain)}</span>
                {token.website && (
                  <a
                    href={token.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Website →
                  </a>
                )}
              </div>
            </div>

            {/* Note about market cap */}
            <div className="mt-2 text-xs text-zinc-600 text-center">
              Market cap hidden during gameplay
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatChainName(chain: string): string {
  const names: Record<string, string> = {
    'ethereum': 'Ethereum',
    'solana': 'Solana',
    'bitcoin': 'Bitcoin',
    'bsc': 'BNB Chain',
    'arbitrum': 'Arbitrum',
    'optimism': 'Optimism',
    'polygon': 'Polygon',
    'avalanche': 'Avalanche',
    'base': 'Base',
    'near': 'NEAR',
    'cosmos': 'Cosmos',
    'dogecoin': 'Dogecoin',
    'cardano': 'Cardano',
    'polkadot': 'Polkadot',
  };
  return names[chain] || chain.charAt(0).toUpperCase() + chain.slice(1);
}

