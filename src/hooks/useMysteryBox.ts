'use client';

import { useState, useCallback } from 'react';
import { MysteryBox, MysteryBoxReward } from '@/lib/mystery-box/generator';

export interface MysteryBoxState {
  eligible: boolean;
  checking: boolean;
  claiming: boolean;
  box: MysteryBox | null;
  transactions: Array<{ to: string; data: string }> | null;
  error: string | null;
}

export interface UseMysteryBoxReturn {
  state: MysteryBoxState;
  checkEligibility: (userId: string, streak: number) => Promise<boolean>;
  claimMysteryBox: (userId: string, streak: number, runId: string, bypassEligibility?: boolean) => Promise<boolean>;
  reset: () => void;
}

const initialState: MysteryBoxState = {
  eligible: false,
  checking: false,
  claiming: false,
  box: null,
  transactions: null,
  error: null,
};

/**
 * Hook for mystery box functionality
 */
export function useMysteryBox(): UseMysteryBoxReturn {
  const [state, setState] = useState<MysteryBoxState>(initialState);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const checkEligibility = useCallback(
    async (userId: string, streak: number): Promise<boolean> => {
      setState(prev => ({ ...prev, checking: true, error: null }));

      try {
        const response = await fetch('/api/mystery-box/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, streak }),
        });

        const data = await response.json();

        if (!data.success) {
          setState(prev => ({
            ...prev,
            checking: false,
            eligible: false,
            error: data.error || 'Failed to check eligibility',
          }));
          return false;
        }

        setState(prev => ({
          ...prev,
          checking: false,
          eligible: data.eligible,
          error: data.eligible ? null : data.reason || 'Not eligible',
        }));

        return data.eligible;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to check eligibility';
        setState(prev => ({
          ...prev,
          checking: false,
          eligible: false,
          error: errorMessage,
        }));
        return false;
      }
    },
    []
  );

  const claimMysteryBox = useCallback(
    async (userId: string, streak: number, runId: string, bypassEligibility = false): Promise<boolean> => {
      setState(prev => ({ ...prev, claiming: true, error: null }));

      try {
        const response = await fetch('/api/mystery-box/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, streak, runId, bypassEligibility }),
        });

        const data = await response.json();

        if (!data.success) {
          setState(prev => ({
            ...prev,
            claiming: false,
            error: data.error || data.reason || 'Failed to claim mystery box',
          }));
          return false;
        }

        if (!data.box) {
          setState(prev => ({
            ...prev,
            claiming: false,
            error: 'Invalid response from server',
          }));
          return false;
        }

        setState(prev => ({
          ...prev,
          claiming: false,
          box: data.box,
          transactions: null, // Transactions built on frontend
          eligible: true,
        }));

        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to claim mystery box';
        setState(prev => ({
          ...prev,
          claiming: false,
          error: errorMessage,
        }));
        return false;
      }
    },
    []
  );

  return {
    state,
    checkEligibility,
    claimMysteryBox,
    reset,
  };
}


