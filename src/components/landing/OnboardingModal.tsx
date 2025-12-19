'use client';

import { useState } from 'react';

type OnboardingStep = 1 | 2 | 3;

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const ONBOARDING_STEPS = [
  {
    step: 1,
    title: 'Guess the Market Cap',
    description: 'Compare two tokens and guess which one has the higher market cap. Test your crypto knowledge!',
    emoji: '🎯',
  },
  {
    step: 2,
    title: 'Build Your Streak',
    description: 'Tap Higher or Lower to make your guess. Each correct answer increases your streak. How high can you go?',
    emoji: '🔥',
  },
  {
    step: 3,
    title: 'Compete & Win',
    description: 'Prove how degen you are by climbing the leaderboard. Weekly prizepool coming soon - top players win!',
    emoji: '🏆',
  },
];

export function OnboardingModal({ isOpen, onComplete, onSkip }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);

  if (!isOpen) return null;

  const currentStepData = ONBOARDING_STEPS[currentStep - 1];
  const isLastStep = currentStep === 3;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => (prev + 1) as OnboardingStep);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      {/* Modal Container - Full screen on mobile, centered on larger screens */}
      <div className="relative w-full max-w-md bg-zinc-900 rounded-2xl md:rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Skip Button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 z-10 min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          aria-label="Skip onboarding"
        >
          <span className="text-sm font-medium">Skip</span>
        </button>

        {/* Content */}
        <div className="p-8 md:p-12">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {ONBOARDING_STEPS.map((step) => (
              <div
                key={step.step}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step.step <= currentStep
                    ? 'bg-yellow-400 w-8'
                    : 'bg-zinc-700 w-1.5'
                }`}
              />
            ))}
          </div>

          {/* Step Content */}
          <div className="text-center mb-8">
            <div className="text-6xl md:text-7xl mb-6">{currentStepData.emoji}</div>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-4">
              {currentStepData.title}
            </h2>
            <p className="text-base md:text-lg text-zinc-300 leading-relaxed">
              {currentStepData.description}
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleNext}
              className="w-full min-h-[44px] py-3 px-8 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/25 transform transition-all duration-200 active:scale-95"
            >
              {isLastStep ? 'Get Started' : 'Next'}
            </button>
            {!isLastStep && (
              <button
                onClick={handleSkip}
                className="w-full min-h-[44px] py-3 px-4 rounded-xl font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Skip
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
