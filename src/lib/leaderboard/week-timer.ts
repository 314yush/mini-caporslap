/**
 * Weekly Leaderboard Timer Utilities
 * Calculates time until next Sunday midnight UTC and formats countdown
 */

/**
 * Gets the next Sunday at midnight UTC
 * @returns Date object for next Sunday 00:00:00 UTC
 */
export function getNextSundayMidnightUTC(): Date {
  const now = new Date();
  const utcDate = new Date(now.toISOString());
  
  // Get the current day of week (0 = Sunday, 6 = Saturday)
  const day = utcDate.getUTCDay();
  
  // Calculate days until next Sunday
  // If today is Sunday, we want next Sunday (7 days away)
  // Otherwise, calculate days until next Sunday
  const daysUntilSunday = day === 0 ? 7 : 7 - day;
  
  const nextSunday = new Date(utcDate);
  nextSunday.setUTCDate(utcDate.getUTCDate() + daysUntilSunday);
  nextSunday.setUTCHours(0, 0, 0, 0);
  
  return nextSunday;
}

/**
 * Gets the current week start (most recent Sunday midnight UTC)
 * @returns Date object for current week start
 */
export function getCurrentWeekStart(): Date {
  const now = new Date();
  const utcDate = new Date(now.toISOString());
  
  const day = utcDate.getUTCDay();
  const daysToSunday = day === 0 ? 0 : day;
  
  const sunday = new Date(utcDate);
  sunday.setUTCDate(utcDate.getUTCDate() - daysToSunday);
  sunday.setUTCHours(0, 0, 0, 0);
  
  return sunday;
}

/**
 * Gets the current week end (next Sunday midnight UTC)
 * @returns Date object for current week end
 */
export function getCurrentWeekEnd(): Date {
  return getNextSundayMidnightUTC();
}

/**
 * Calculates time remaining until next Sunday midnight UTC
 * @returns Object with days, hours, minutes, seconds
 */
export function getTimeUntilNextWeek(): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
} {
  const now = new Date();
  const nextSunday = getNextSundayMidnightUTC();
  
  const diffMs = nextSunday.getTime() - now.getTime();
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  
  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;
  
  return {
    days,
    hours,
    minutes,
    seconds,
    totalSeconds,
  };
}

/**
 * Formats countdown time as a human-readable string
 * @param timeUntil - Time until object from getTimeUntilNextWeek
 * @returns Formatted string like "2 days, 5 hours, 30 minutes"
 */
export function formatCountdown(timeUntil: ReturnType<typeof getTimeUntilNextWeek>): string {
  const parts: string[] = [];
  
  if (timeUntil.days > 0) {
    parts.push(`${timeUntil.days} ${timeUntil.days === 1 ? 'day' : 'days'}`);
  }
  
  if (timeUntil.hours > 0) {
    parts.push(`${timeUntil.hours} ${timeUntil.hours === 1 ? 'hour' : 'hours'}`);
  }
  
  if (timeUntil.minutes > 0 && timeUntil.days === 0) {
    parts.push(`${timeUntil.minutes} ${timeUntil.minutes === 1 ? 'minute' : 'minutes'}`);
  }
  
  if (timeUntil.days === 0 && timeUntil.hours === 0 && timeUntil.minutes === 0) {
    parts.push(`${timeUntil.seconds} ${timeUntil.seconds === 1 ? 'second' : 'seconds'}`);
  }
  
  if (parts.length === 0) {
    return '0 seconds';
  }
  
  return parts.join(', ');
}

/**
 * Formats countdown in a compact format (DD:HH:MM:SS)
 * @param timeUntil - Time until object from getTimeUntilNextWeek
 * @returns Formatted string like "02:05:30:45"
 */
export function formatCountdownCompact(timeUntil: ReturnType<typeof getTimeUntilNextWeek>): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(timeUntil.days)}:${pad(timeUntil.hours)}:${pad(timeUntil.minutes)}:${pad(timeUntil.seconds)}`;
}

