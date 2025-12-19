'use client';

import { Guess } from '@/lib/game-core/types';

interface ActionButtonsProps {
  onGuess: (guess: Guess) => void;
  disabled?: boolean;
}

export function ActionButtons({ onGuess, disabled }: ActionButtonsProps) {
  return (
    <div className="flex flex-col gap-4 w-full max-w-sm">
      {/* CAP Button - Higher */}
      <button
        onClick={() => onGuess('cap')}
        disabled={disabled}
        className="
          relative w-full py-5 px-8 
          rounded-2xl font-bold text-xl
          bg-gradient-to-br from-emerald-500 to-emerald-600
          text-white shadow-lg shadow-emerald-500/25
          transform transition-all duration-150
          hover:scale-[1.02] hover:shadow-emerald-500/40
          active:scale-[0.98]
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
          border border-emerald-400/20
        "
      >
        <span className="flex items-center justify-center gap-3">
          <span className="text-2xl">⬆️</span>
          <span>CAP</span>
        </span>
        <span className="block text-sm font-normal opacity-80 mt-1">
          Next is HIGHER
        </span>
      </button>

      {/* SLAP Button - Lower */}
      <button
        onClick={() => onGuess('slap')}
        disabled={disabled}
        className="
          relative w-full py-5 px-8 
          rounded-2xl font-bold text-xl
          bg-gradient-to-br from-rose-500 to-rose-600
          text-white shadow-lg shadow-rose-500/25
          transform transition-all duration-150
          hover:scale-[1.02] hover:shadow-rose-500/40
          active:scale-[0.98]
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
          border border-rose-400/20
        "
      >
        <span className="flex items-center justify-center gap-3">
          <span className="text-2xl">⬇️</span>
          <span>SLAP</span>
        </span>
        <span className="block text-sm font-normal opacity-80 mt-1">
          Next is LOWER
        </span>
      </button>
    </div>
  );
}


