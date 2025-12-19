/**
 * CapOrSlap Typography System
 * 
 * Primary Font: Space Grotesk - Modern, geometric, tech-forward
 * Display Font: JetBrains Mono (optional) - For numbers and code-like elements
 */

// Font families
export const fontFamilies = {
  primary: 'var(--font-space-grotesk), system-ui, sans-serif',
  mono: 'JetBrains Mono, Fira Code, monospace',
} as const;

// Font sizes with Tailwind classes
export const fontSize = {
  // Display sizes (landing page, heroes)
  display: {
    xl: 'text-6xl md:text-7xl',   // Hero titles
    lg: 'text-5xl md:text-6xl',   // Landing page title
    md: 'text-4xl md:text-5xl',   // Section headers
  },
  // Heading sizes
  heading: {
    h1: 'text-3xl md:text-4xl',   // Page titles
    h2: 'text-2xl md:text-3xl',   // Section titles
    h3: 'text-xl md:text-2xl',    // Subsection titles
    h4: 'text-lg md:text-xl',     // Card titles
  },
  // Body sizes
  body: {
    lg: 'text-lg',                // Large body text
    md: 'text-base',              // Default body
    sm: 'text-sm',                // Small text
    xs: 'text-xs',                // Micro text, labels
  },
} as const;

// Font weights
export const fontWeight = {
  black: 'font-black',     // 900 - Headlines, logo
  bold: 'font-bold',       // 700 - Emphasis
  semibold: 'font-semibold', // 600 - Buttons
  medium: 'font-medium',   // 500 - Body emphasis
  normal: 'font-normal',   // 400 - Body text
} as const;

// Text styles (combined utilities)
export const textStyles = {
  // Display styles
  displayHero: 'text-5xl md:text-6xl font-black tracking-tight',
  displayTitle: 'text-4xl md:text-5xl font-black tracking-tight',
  
  // Heading styles
  h1: 'text-3xl md:text-4xl font-black tracking-tight',
  h2: 'text-2xl md:text-3xl font-bold',
  h3: 'text-xl md:text-2xl font-bold',
  h4: 'text-lg font-semibold',
  
  // Body styles
  bodyLg: 'text-lg font-normal leading-relaxed',
  body: 'text-base font-normal',
  bodySm: 'text-sm font-normal',
  
  // Special styles
  label: 'text-xs font-medium uppercase tracking-widest',
  caption: 'text-xs font-normal text-zinc-500',
  
  // Number styles (for market caps, streaks, timers)
  number: 'font-bold tabular-nums',
  numberLg: 'text-4xl md:text-5xl font-black tabular-nums',
  numberMd: 'text-2xl font-bold tabular-nums',
  numberSm: 'text-lg font-bold tabular-nums',
  
  // Token styles
  tokenSymbol: 'text-3xl md:text-4xl font-black tracking-tight',
  tokenName: 'text-sm font-medium text-zinc-400',
} as const;

// Line heights
export const lineHeight = {
  tight: 'leading-tight',
  snug: 'leading-snug',
  normal: 'leading-normal',
  relaxed: 'leading-relaxed',
} as const;

// Letter spacing
export const letterSpacing = {
  tighter: 'tracking-tighter',
  tight: 'tracking-tight',
  normal: 'tracking-normal',
  wide: 'tracking-wide',
  wider: 'tracking-wider',
  widest: 'tracking-widest',
} as const;

export const typography = {
  fontFamilies,
  fontSize,
  fontWeight,
  textStyles,
  lineHeight,
  letterSpacing,
} as const;

export default typography;
