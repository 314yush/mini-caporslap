/**
 * Webhook endpoint for Base Mini-App notifications
 * Handles events from Farcaster/Base when users interact with the mini-app
 * 
 * Events:
 * - miniapp_added: User added the mini-app
 * - miniapp_removed: User removed the mini-app
 * - notifications_enabled: User enabled notifications
 * - notifications_disabled: User disabled notifications
 * 
 * See: https://docs.base.org/mini-apps/core-concepts/notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  parseWebhookEvent,
  verifyAppKeyWithNeynar,
} from '@farcaster/miniapp-node';
import {
  setUserNotificationDetails,
  deleteUserNotificationDetails,
  sendWelcomeNotification,
} from '@/lib/notifications';

// Base app FID for reference
const BASE_APP_FID = 309857;

export async function POST(request: NextRequest) {
  try {
    const requestJson = await request.json();
    
    // Log raw webhook for debugging
    console.log('[Webhook] Raw event received:', {
      timestamp: new Date().toISOString(),
      hasData: !!requestJson,
    });

    // Verify and parse the webhook event
    let data;
    try {
      data = await parseWebhookEvent(requestJson, verifyAppKeyWithNeynar);
    } catch (verifyError) {
      console.error('[Webhook] Verification failed:', verifyError);
      
      // Return appropriate error based on verification failure
      if (verifyError instanceof Error) {
        if (verifyError.message.includes('invalid')) {
          return NextResponse.json(
            { success: false, error: 'Invalid webhook signature' },
            { status: 401 }
          );
        }
      }
      
      return NextResponse.json(
        { success: false, error: 'Webhook verification failed' },
        { status: 400 }
      );
    }

    const { fid, appFid, event } = data;

    // Log verified event
    console.log('[Webhook] Verified event:', {
      fid,
      appFid,
      eventType: event.event,
      isBaseApp: appFid === BASE_APP_FID,
    });

    // Handle different event types
    // IMPORTANT: Process quickly and return response within 10 seconds
    // to avoid timeout issues (especially on Base app which waits for response)
    switch (event.event) {
      case 'miniapp_added':
        // User added the mini-app to their profile
        console.log('[Webhook] Mini-app added by user:', fid);
        
        if (event.notificationDetails) {
          // Store notification details
          await setUserNotificationDetails(fid, appFid, event.notificationDetails);
          
          // Send welcome notification asynchronously (don't await to respond quickly)
          sendWelcomeNotification(fid, appFid).catch(err => {
            console.error('[Webhook] Failed to send welcome notification:', err);
          });
        }
        break;

      case 'miniapp_removed':
        // User removed the mini-app
        console.log('[Webhook] Mini-app removed by user:', fid);
        await deleteUserNotificationDetails(fid, appFid);
        break;

      case 'notifications_enabled':
        // User enabled notifications
        if (event.notificationDetails) {
          console.log('[Webhook] Notifications enabled for user:', fid);
          await setUserNotificationDetails(fid, appFid, event.notificationDetails);
          
          // Send confirmation notification asynchronously
          sendWelcomeNotification(fid, appFid).catch(err => {
            console.error('[Webhook] Failed to send confirmation notification:', err);
          });
        }
        break;

      case 'notifications_disabled':
        // User disabled notifications
        console.log('[Webhook] Notifications disabled for user:', fid);
        await deleteUserNotificationDetails(fid, appFid);
        break;

      default:
        console.log('[Webhook] Unknown event type');
    }

    // Always return 200 quickly to acknowledge receipt
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET requests (for webhook verification/testing)
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
