/**
 * CapOrSlap Brand Color System
 * Theme: "Dripping Liquid Crypto Battle Arena"
 * 
 * Color palette based on the dripping liquid logo with
 * Blue (Cap) → Orange (Or) → Pink/Red (Slap) gradient
 */

// Background colors
export const background = {
  primary: '#09090b',    // zinc-950 - Deep black
  secondary: '#18181b',  // zinc-900 - Card backgrounds
  tertiary: '#27272a',   // zinc-800 - Elevated surfaces
} as const;

// Cap colors (Blue) - Higher/Gains
export const cap = {
  light: '#60a5fa',   // sky blue / blue-400
  base: '#3b82f6',    // blue-500
  dark: '#1e40af',    // blue-800
  gradient: 'from-blue-400 via-blue-500 to-blue-800',
} as const;

// Or colors (Orange) - Energy/Action
export const or = {
  light: '#fb923c',   // orange-400
  base: '#f97316',    // orange-500
  dark: '#ea580c',    // orange-600
  gradient: 'from-orange-400 via-orange-500 to-orange-600',
} as const;

// Slap colors (Pink/Red) - Lower/Losses
export const slap = {
  light: '#f472b6',   // pink-400
  base: '#ec4899',    // pink-500
  dark: '#be185d',    // pink-700
  gradient: 'from-pink-400 via-pink-500 to-pink-700',
} as const;

// Game action colors
export const action = {
  success: '#34d399',       // emerald-400 - Correct guesses
  successDark: '#059669',   // emerald-600
  danger: '#fb7185',        // rose-400 - Losses
  dangerDark: '#e11d48',    // rose-600
  successGradient: 'from-emerald-400 to-emerald-600',
  dangerGradient: 'from-rose-400 to-rose-600',
} as const;

// Outline colors (for logo/text outlines)
export const outline = {
  primary: '#4c1d95',   // violet-900
  secondary: '#312e81', // indigo-900
} as const;

// Text colors
export const text = {
  primary: '#fafafa',     // White
  secondary: '#a1a1aa',   // zinc-400
  muted: '#71717a',       // zinc-500
  accent: '#fbbf24',      // amber-400 (legacy accent)
} as const;

// Logo gradient (horizontal)
export const logoGradient = 'from-blue-400 via-orange-500 to-pink-500';

// Full brand color export
export const brandColors = {
  background,
  cap,
  or,
  slap,
  action,
  outline,
  text,
  logoGradient,
} as const;

export default brandColors;
