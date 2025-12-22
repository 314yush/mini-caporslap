'use client';

import { Run, ShareData, GuessResult } from '../game-core/types';
import { detectEnvironment } from '../environment';

/**
 * Sharing system for CapOrSlap
 * Generates challenge text and handles sharing across environments
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://caporslap.com';

/**
 * Token-specific share message templates
 * [X] = currentToken.symbol (the token they were on)
 * [Y] = nextToken.symbol (the token they guessed incorrectly)
 * [ABC] = streak number
 */
const TOKEN_SPECIFIC_SHARE_TEMPLATES = [
  "I'm stupid, I thought [X] had a higher mcap than [Y] 😭 Funny? You try beating my score of [ABC]",
  "Cute of me to think [X] had a higher mcap than [Y] :) Funny? You try beating my score!",
  "Plot twist: [X] actually has a LOWER mcap than [Y] 🤡 My [ABC] streak says otherwise",
  "Me confidently saying [X] > [Y]: 🤓 Reality: 📉 Got rekt at streak [ABC]",
  "That moment when you're 100% sure [X] beats [Y]... and you're wrong 💀 Streak [ABC] on CapOrSlap",
  "I really thought [X] was bigger than [Y]... I was so wrong it's not even funny 😂 Beat my [ABC]?",
  "The audacity of me thinking [X] > [Y] 🫠 Can you do better than streak [ABC]?",
  "Me: '[X] definitely has higher mcap than [Y]' Also me: *gets humbled at streak [ABC]* 💀",
  "Imagine thinking [X] beats [Y]... couldn't be me (it was me, I got rekt at [ABC]) 🎭",
  "When you're so confident [X] > [Y] that you forget to check... streak [ABC] says hi 👋",
];

/**
 * Generates share data for a completed run
 * @param run - Completed run
 * @param customMessage - Optional custom message
 * @returns ShareData object
 */
export function generateShareData(run: Run, customMessage?: string): ShareData {
  let message: string;
  
  if (customMessage) {
    message = customMessage;
  } else if (run.failedGuess) {
    // Use token-specific templates when we have the failed guess info
    const template = TOKEN_SPECIFIC_SHARE_TEMPLATES[
      Math.floor(Math.random() * TOKEN_SPECIFIC_SHARE_TEMPLATES.length)
    ];
    
    // Replace placeholders
    message = template
      .replace(/\[X\]/g, run.failedGuess.currentToken.symbol)
      .replace(/\[Y\]/g, run.failedGuess.nextToken.symbol)
      .replace(/\[ABC\]/g, run.streak.toString());
  } else {
    // Fallback to generic messages if no failedGuess data
    const defaultMessages = [
      `I got humbled at streak ${run.streak} on CapOrSlap 😭`,
      `Just lost my ${run.streak} streak on CapOrSlap 💀`,
      `RIP my ${run.streak} streak on CapOrSlap 🪦`,
      `Got rekt at streak ${run.streak} playing CapOrSlap 📉`,
    ];
    message = defaultMessages[Math.floor(Math.random() * defaultMessages.length)];
  }
  
  const challengeUrl = `${APP_URL}?challenge=${run.runId}`;
  
  return {
    streak: run.streak,
    runId: run.runId,
    userId: run.userId,
    message,
    url: challengeUrl,
  };
}

/**
 * Generates full share text with message and URL
 * @param shareData - Share data object
 * @returns Complete share text
 */
export function generateShareText(shareData: ShareData): string {
  return `${shareData.message}\n\nCan you beat me?\n${shareData.url}`;
}

/**
 * Shares run via appropriate method for current environment
 * @param run - Completed run
 * @returns Whether share was initiated
 */
export async function shareRun(run: Run): Promise<boolean> {
  const shareData = generateShareData(run);
  const shareText = generateShareText(shareData);
  const environment = detectEnvironment();
  
  if (environment === 'miniapp') {
    return await shareToCast(shareData);
  }
  
  return shareToClipboard(shareText);
}

/**
 * Copies share text to clipboard (web mode)
 * @param text - Text to copy
 * @returns Whether copy succeeded
 */
export async function shareToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined') return false;
  
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    
    // Fallback for older browsers
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Opens Warpcast to create a cast (mini-app mode)
 * @param shareData - Share data
 * @returns Whether cast composer was opened
 */
export async function shareToCast(shareData: ShareData): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  // In Mini-App context, prefer the SDK compose action.
  // Fallback to Warpcast intent URL if unavailable.
  const text = `${shareData.message}\n\nCan you beat me?`;

  try {
    const mod = await import('@/lib/farcaster/sdk');
    const ok = await mod.miniAppComposeCast({
      text,
      embeds: [shareData.url],
    });
    if (ok) return true;
  } catch {
    // Ignore and fall back.
  }

  window.open(getWarpcastShareUrl(shareData), '_blank');
  return true;
}

/**
 * Shares via Web Share API if available
 * @param shareData - Share data
 * @returns Whether native share was triggered
 */
export async function shareNative(shareData: ShareData): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.share) return false;
  
  try {
    await navigator.share({
      title: 'CapOrSlap Challenge',
      text: shareData.message,
      url: shareData.url,
    });
    return true;
  } catch (error) {
    // User cancelled or share failed
    console.log('Native share cancelled or failed:', error);
    return false;
  }
}

/**
 * Gets share text for preview
 * @param streak - Streak number
 * @param failedGuess - Optional failed guess data for token-specific preview
 * @returns Preview text
 */
export function getSharePreview(streak: number, failedGuess?: GuessResult | null): string {
  if (failedGuess) {
    // Use a token-specific template for preview
    const template = TOKEN_SPECIFIC_SHARE_TEMPLATES[0]; // Use first template for consistency
    const message = template
      .replace(/\[X\]/g, failedGuess.currentToken.symbol)
      .replace(/\[Y\]/g, failedGuess.nextToken.symbol)
      .replace(/\[ABC\]/g, streak.toString());
    return `${message}\n\nCan you beat me?\n[link]`;
  }
  return `I got humbled at streak ${streak} on CapOrSlap 😭\n\nCan you beat me?\n[link]`;
}

/**
 * Generates Twitter/X share URL
 * @param shareData - Share data
 * @returns Twitter intent URL
 */
export function getTwitterShareUrl(shareData: ShareData): string {
  const text = encodeURIComponent(`${shareData.message}\n\nCan you beat me?`);
  const url = encodeURIComponent(shareData.url);
  return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
}

/**
 * Generates Warpcast share URL
 * @param shareData - Share data
 * @returns Warpcast intent URL
 */
export function getWarpcastShareUrl(shareData: ShareData): string {
  const text = encodeURIComponent(`${shareData.message}\n\nCan you beat me?`);
  const embed = encodeURIComponent(shareData.url);
  return `https://warpcast.com/~/compose?text=${text}&embeds[]=${embed}`;
}

/**
 * Generates leaderboard share text
 * @param rank - User's rank
 * @param score - User's score (streak or cumulative)
 * @param type - Leaderboard type
 * @param prizeEstimate - Optional prize estimate
 * @returns Share text
 */
export function generateLeaderboardShareText(
  rank: number,
  score: number,
  type: 'weekly' | 'global',
  prizeEstimate?: number
): string {
  if (type === 'weekly' && prizeEstimate) {
    return `I'm ranked #${rank} on CapOrSlap with ${score} score! $${prizeEstimate.toFixed(2)} estimated prize this week 🏆`;
  }
  return `I'm ranked #${rank} on CapOrSlap with ${score} score! 🏆`;
}






