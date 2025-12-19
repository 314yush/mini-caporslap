'use client';

import { Run, ShareData } from '../game-core/types';
import { detectEnvironment } from '../environment';

/**
 * Sharing system for CapOrSlap
 * Generates challenge text and handles sharing across environments
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://caporslap.com';

/**
 * Generates share data for a completed run
 * @param run - Completed run
 * @param customMessage - Optional custom message
 * @returns ShareData object
 */
export function generateShareData(run: Run, customMessage?: string): ShareData {
  const defaultMessages = [
    `I got humbled at streak ${run.streak} on CapOrSlap 😭`,
    `Just lost my ${run.streak} streak on CapOrSlap 💀`,
    `RIP my ${run.streak} streak on CapOrSlap 🪦`,
    `Got rekt at streak ${run.streak} playing CapOrSlap 📉`,
  ];
  
  const message = customMessage || defaultMessages[Math.floor(Math.random() * defaultMessages.length)];
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
 * @returns Preview text
 */
export function getSharePreview(streak: number): string {
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



