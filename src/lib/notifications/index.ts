/**
 * Notification system for CapOrSlap Mini App
 * Handles storing notification tokens and sending push notifications
 * 
 * See: https://docs.base.org/mini-apps/core-concepts/notifications
 */

import { getRedis } from '../redis';

// Types
export interface NotificationDetails {
  url: string;
  token: string;
}

export interface NotificationPayload {
  notificationId: string;
  title: string;
  body: string;
  targetUrl: string;
  tokens: string[];
}

export interface SendNotificationResult {
  state: 'success' | 'no_token' | 'rate_limit' | 'error';
  error?: unknown;
}

// Redis key patterns for notification storage
const NOTIFICATION_KEYS = {
  // Key: notification:{fid}:{appFid} -> NotificationDetails
  userNotification: (fid: number, appFid: number) => `notification:${fid}:${appFid}`,
  // Set of all FIDs with notifications enabled (for bulk notifications)
  allNotificationUsers: () => 'notification:users',
};

/**
 * Stores notification details for a user
 * Called when user enables notifications (miniapp_added or notifications_enabled)
 */
export async function setUserNotificationDetails(
  fid: number,
  appFid: number,
  details: NotificationDetails
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) {
    console.warn('[Notifications] Redis not configured - cannot store notification details');
    return false;
  }

  try {
    // Store notification details
    await redis.set(
      NOTIFICATION_KEYS.userNotification(fid, appFid),
      JSON.stringify(details),
      { ex: 60 * 60 * 24 * 365 } // 1 year expiry
    );

    // Add to set of users with notifications
    await redis.sadd(NOTIFICATION_KEYS.allNotificationUsers(), `${fid}:${appFid}`);

    console.log('[Notifications] Stored notification details for:', { fid, appFid });
    return true;
  } catch (error) {
    console.error('[Notifications] Failed to store notification details:', error);
    return false;
  }
}

/**
 * Gets notification details for a user
 */
export async function getUserNotificationDetails(
  fid: number,
  appFid: number
): Promise<NotificationDetails | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const data = await redis.get<string>(NOTIFICATION_KEYS.userNotification(fid, appFid));
    if (!data) return null;

    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (error) {
    console.error('[Notifications] Failed to get notification details:', error);
    return null;
  }
}

/**
 * Deletes notification details for a user
 * Called when user disables notifications or removes mini app
 */
export async function deleteUserNotificationDetails(
  fid: number,
  appFid: number
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  try {
    await redis.del(NOTIFICATION_KEYS.userNotification(fid, appFid));
    await redis.srem(NOTIFICATION_KEYS.allNotificationUsers(), `${fid}:${appFid}`);

    console.log('[Notifications] Deleted notification details for:', { fid, appFid });
    return true;
  } catch (error) {
    console.error('[Notifications] Failed to delete notification details:', error);
    return false;
  }
}

/**
 * Sends a notification to a specific user
 */
export async function sendNotification({
  fid,
  appFid,
  title,
  body,
  targetUrl,
}: {
  fid: number;
  appFid: number;
  title: string;
  body: string;
  targetUrl?: string;
}): Promise<SendNotificationResult> {
  const notificationDetails = await getUserNotificationDetails(fid, appFid);
  
  if (!notificationDetails) {
    return { state: 'no_token' };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://caporslap.fun';

  try {
    const response = await fetch(notificationDetails.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notificationId: crypto.randomUUID(),
        title: title.slice(0, 32), // Max 32 chars
        body: body.slice(0, 128), // Max 128 chars
        targetUrl: targetUrl || appUrl,
        tokens: [notificationDetails.token],
      } satisfies NotificationPayload),
    });

    const responseJson = await response.json();

    if (response.status === 200) {
      // Check for rate limiting
      if (responseJson.result?.rateLimitedTokens?.length > 0) {
        return { state: 'rate_limit' };
      }

      // Check for invalid tokens (user disabled notifications without our knowledge)
      if (responseJson.result?.invalidTokens?.length > 0) {
        // Clean up invalid token
        await deleteUserNotificationDetails(fid, appFid);
        return { state: 'error', error: 'Token invalidated' };
      }

      return { state: 'success' };
    } else {
      return { state: 'error', error: responseJson };
    }
  } catch (error) {
    console.error('[Notifications] Failed to send notification:', error);
    return { state: 'error', error };
  }
}

/**
 * Sends a welcome notification when user adds the mini app
 */
export async function sendWelcomeNotification(fid: number, appFid: number): Promise<void> {
  const result = await sendNotification({
    fid,
    appFid,
    title: '🎮 Welcome to CapOrSlap!',
    body: 'Ready to test your crypto knowledge? Start playing now!',
  });

  console.log('[Notifications] Welcome notification result:', result);
}

/**
 * Sends a notification when user gets overtaken on leaderboard
 */
export async function sendOvertakeNotification(
  fid: number,
  appFid: number,
  overtakerName: string,
  newRank: number
): Promise<void> {
  const result = await sendNotification({
    fid,
    appFid,
    title: '📉 You got overtaken!',
    body: `${overtakerName} just passed you. You're now #${newRank}. Fight back!`,
  });

  console.log('[Notifications] Overtake notification result:', result);
}

/**
 * Sends a notification for a new high score
 */
export async function sendHighScoreNotification(
  fid: number,
  appFid: number,
  streak: number,
  rank: number
): Promise<void> {
  const result = await sendNotification({
    fid,
    appFid,
    title: '🏆 New Personal Best!',
    body: `You hit a ${streak} streak! You're now ranked #${rank}.`,
  });

  console.log('[Notifications] High score notification result:', result);
}

/**
 * Sends a notification when user's rank changes
 */
export async function sendPositionChangeNotification(
  fid: number,
  appFid: number,
  previousRank: number,
  currentRank: number,
  direction: 'up' | 'down'
): Promise<void> {
  const rankChange = Math.abs(currentRank - previousRank);
  
  if (direction === 'up') {
    const result = await sendNotification({
      fid,
      appFid,
      title: '📈 Rank Improved!',
      body: `You moved up ${rankChange} position${rankChange > 1 ? 's' : ''}! Now ranked #${currentRank}.`,
    });
    console.log('[Notifications] Position change notification result:', result);
  } else if (direction === 'down' && currentRank <= 50) {
    // Only notify if still in top 50
    const result = await sendNotification({
      fid,
      appFid,
      title: '📉 Rank Changed',
      body: `You're now ranked #${currentRank}. Keep playing to climb back up!`,
    });
    console.log('[Notifications] Position change notification result:', result);
  }
}

/**
 * Sends a notification when user enters or is in prize range
 */
export async function sendPrizePoolRankNotification(
  fid: number,
  appFid: number,
  rank: number,
  prizeEstimate: number
): Promise<void> {
  if (rank <= 50) {
    const result = await sendNotification({
      fid,
      appFid,
      title: '💰 In Prize Range!',
      body: `You're ranked #${rank}! Estimated prize: $${prizeEstimate.toFixed(2)}. Keep playing!`,
    });
    console.log('[Notifications] Prize pool rank notification result:', result);
  }
}







