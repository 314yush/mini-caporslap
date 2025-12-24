'use client';

interface SponsorAdCardProps {
  sponsor: {
    companyName: string;
    tokenSymbol: string;
    tokenName: string;
    logoUrl?: string;
  };
  ctaText?: string;
  ctaUrl?: string;
}

export function SponsorAdCard({ sponsor, ctaText = 'Trade Now', ctaUrl }: SponsorAdCardProps) {
  const handleClick = () => {
    if (ctaUrl) {
      window.open(ctaUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl mb-4 border border-purple-700/50 bg-gradient-to-br from-purple-900/40 via-blue-900/40 to-purple-800/40 backdrop-blur-sm">
      {/* Background pattern with subtle coins */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-4 right-8 text-2xl">🪙</div>
        <div className="absolute bottom-8 left-12 text-xl">🪙</div>
        <div className="absolute top-1/2 right-1/4 text-lg">🪙</div>
      </div>
      
      <div className="relative p-4 flex items-center justify-between gap-4">
        {/* Left side - Logo and text */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {sponsor.logoUrl ? (
            <div className="w-12 h-12 rounded-full overflow-hidden bg-purple-800/50 shrink-0 border border-purple-600/50">
              <img 
                src={sponsor.logoUrl} 
                alt={sponsor.companyName}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0 border border-purple-500/50">
              {sponsor.companyName.charAt(0).toUpperCase()}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-purple-300/80 font-medium">🔥 Sponsored</span>
            </div>
            <div className="text-white font-semibold text-sm truncate">
              Trade {sponsor.tokenSymbol} on {sponsor.companyName}
            </div>
            <div className="text-purple-200/70 text-xs">
              0 fees • Deep liquidity
            </div>
          </div>
        </div>
        
        {/* Right side - CTA button */}
        <button
          onClick={handleClick}
          className="
            shrink-0 px-4 py-2 rounded-lg
            bg-purple-700/50 border border-purple-500/50
            text-white font-medium text-sm
            hover:bg-purple-600/60 hover:border-purple-400/60
            transition-all duration-200
            flex items-center gap-1.5
            shadow-lg shadow-purple-500/10
          "
        >
          <span>🔥</span>
          <span>{ctaText}</span>
        </button>
      </div>
    </div>
  );
}




