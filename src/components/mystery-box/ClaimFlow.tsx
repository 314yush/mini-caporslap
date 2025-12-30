'use client';

import { useState } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { createWalletClient, custom } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { MysteryBoxReward } from '@/lib/mystery-box/generator';

import { buildAirdropTransactions } from '@/lib/mystery-box/airdrop';

// Get chain configuration based on environment
function getChainConfig() {
  const network = process.env.NEXT_PUBLIC_NETWORK;
  if (network === 'testnet') {
    return {
      chain: baseSepolia,
      chainId: 84532,
    };
  }
  return {
    chain: base,
    chainId: 8453,
  };
}

interface ClaimFlowProps {
  boxId: string;
  rewards: MysteryBoxReward[];
  onSuccess: () => void;
  onError: (error: string) => void;
}

type ClaimStatus = 'idle' | 'signing' | 'pending' | 'verifying' | 'success' | 'error';

export function ClaimFlow({
  boxId,
  rewards,
  onSuccess,
  onError,
}: ClaimFlowProps) {
  const { wallets } = useWallets();
  const [status, setStatus] = useState<ClaimStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClaim = async () => {
    setStatus('signing');
    setError(null);

    try {
      // Check if rewards exist
      if (!rewards || rewards.length === 0) {
        throw new Error('No rewards to claim');
      }

      const wallet = wallets[0];
      if (!wallet) {
        throw new Error('Please connect your wallet to claim rewards');
      }

      // Get chain configuration
      const chainConfig = getChainConfig();
      
      // Switch to correct chain if needed
      try {
        await wallet.switchChain(chainConfig.chainId);
      } catch {
        console.warn(`Could not switch to chain ${chainConfig.chainId}`);
      }

      const provider = await wallet.getEthereumProvider();
      const walletClient = createWalletClient({
        chain: chainConfig.chain,
        transport: custom(provider),
      });

      const [account] = await walletClient.getAddresses();
      if (!account) {
        throw new Error('No account found');
      }

      // Build airdrop transactions with user's address
      const transactions = buildAirdropTransactions(rewards, account);

      // Execute all transactions sequentially
      // In production, you might want to batch these or use a multicall contract
      setStatus('pending');
      const hashes: string[] = [];

      for (let i = 0; i < transactions.length; i++) {
        const tx = transactions[i];
        try {
          const hash = await walletClient.sendTransaction({
            account,
            to: tx.to,
            data: tx.data,
            chain: chainConfig.chain,
          });
          hashes.push(hash);
        } catch (txError) {
          // If user rejects transaction, throw immediately
          if (txError instanceof Error && (
            txError.message.includes('rejected') ||
            txError.message.includes('denied') ||
            txError.message.includes('User rejected')
          )) {
            throw new Error('Transaction rejected by user');
          }
          // For other transaction errors, continue but log
          console.error(`[ClaimFlow] Transaction ${i + 1} failed:`, txError);
          throw txError;
        }
      }

      // Use the last transaction hash for verification
      const lastHash = hashes[hashes.length - 1];
      setTxHash(lastHash);

      // Verify on server
      setStatus('verifying');
      const verifyResponse = await fetch('/api/mystery-box/airdrop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boxId,
          txHash: lastHash,
          userAddress: account,
          tokenAddresses: rewards.map(r => r.address),
        }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyData.success) {
        // If box was already claimed, treat it as success (user already got their reward)
        if (verifyData.error?.includes('already claimed')) {
          setStatus('success');
          onSuccess();
          return;
        }
        throw new Error(verifyData.error || 'Verification failed');
      }

      setStatus('success');
      onSuccess();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to claim reward';
      
      // Don't show error if box was already claimed (user already got reward)
      if (errorMessage.includes('already claimed')) {
        setStatus('success');
        onSuccess();
        return;
      }
      
      // Handle user rejection gracefully
      if (
        errorMessage.includes('rejected') ||
        errorMessage.includes('denied') ||
        errorMessage.includes('User rejected') ||
        errorMessage.includes('user rejected')
      ) {
        setError('Transaction was cancelled. You can try again.');
        setStatus('idle'); // Reset to idle so user can retry
        return; // Don't call onError for user cancellations
      }
      
      // Handle network errors
      if (
        errorMessage.includes('network') ||
        errorMessage.includes('Network') ||
        errorMessage.includes('connection')
      ) {
        setError('Network error. Please check your connection and try again.');
        setStatus('idle');
        return;
      }
      
      // Handle insufficient funds
      if (
        errorMessage.includes('insufficient') ||
        errorMessage.includes('balance')
      ) {
        setError('Insufficient funds for transaction. Please add funds to your wallet.');
        setStatus('idle');
        return;
      }
      
      setError(errorMessage);
      setStatus('error');
      onError(errorMessage);
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'signing':
        return 'Confirm in wallet...';
      case 'pending':
        return 'Transaction pending...';
      case 'verifying':
        return 'Verifying airdrop...';
      case 'success':
        return 'Reward claimed!';
      case 'error':
        return 'Claim failed';
      default:
        return '';
    }
  };

  return (
    <div className="w-full space-y-3 md:space-y-4">
      {/* Rewards summary */}
      <div className="p-3 md:p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
        <h3 className="text-white font-bold mb-2 md:mb-3 text-sm md:text-base">Your Rewards</h3>
        <div className="space-y-1.5 md:space-y-2">
          {rewards.map((reward, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-xs md:text-sm"
            >
              <span className="text-zinc-300">{reward.symbol}</span>
              <span className="text-emerald-400 font-bold">
                ${reward.usdValue.toFixed(2)}
              </span>
            </div>
          ))}
          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
            <span className="text-white font-bold text-sm md:text-base">Total</span>
            <span className="text-emerald-400 font-bold text-base md:text-lg">
              ${rewards.reduce((sum, r) => sum + r.usdValue, 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Status */}
      {status !== 'idle' && (
        <div
          className={`p-2 md:p-3 rounded-lg text-center ${
            status === 'error'
              ? 'bg-rose-900/50 border border-rose-500/50'
              : status === 'success'
              ? 'bg-emerald-900/50 border border-emerald-500/50'
              : 'bg-amber-900/50 border border-amber-500/50'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            {status === 'verifying' || status === 'pending' ? (
              <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
            ) : status === 'success' ? (
              <span className="text-xl md:text-2xl">✓</span>
            ) : status === 'error' ? (
              <span className="text-xl md:text-2xl">✗</span>
            ) : null}
            <p
              className={`text-xs md:text-sm ${
                status === 'error'
                  ? 'text-rose-300'
                  : status === 'success'
                  ? 'text-emerald-300'
                  : 'text-amber-300'
              }`}
            >
              {getStatusText()}
            </p>
          </div>
          {txHash && (
            <p className="text-zinc-400 text-xs mt-1 md:mt-2 truncate px-2">
              TX: {txHash.slice(0, 8)}...{txHash.slice(-6)}
            </p>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-2 md:p-3 rounded-lg bg-rose-900/50 border border-rose-500/50 text-rose-300 text-xs md:text-sm">
          {error}
        </div>
      )}

      {/* Claim button */}
      {status !== 'success' && (
        <button
          onClick={handleClaim}
          disabled={status !== 'idle' && status !== 'error'}
          className="w-full py-3 md:py-4 px-4 md:px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-base md:text-lg shadow-lg shadow-emerald-500/30 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 touch-manipulation"
        >
          {status === 'idle' ? 'Claim Reward' : getStatusText()}
        </button>
      )}
    </div>
  );
}

