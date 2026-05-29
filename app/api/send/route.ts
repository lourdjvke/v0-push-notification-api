import { NextRequest, NextResponse } from 'next/server';
import { database, ref, get } from '@/lib/firebase';
import { validateApiKeyAsync, createErrorResponse, createSuccessResponse } from '@/lib/api-auth';
import { sendPushNotification, sendPushNotificationsToMany, PushNotification } from '@/lib/push-service';
import { handleCorsPreFlight, createCorsErrorResponse, createCorsSuccessResponse } from '@/lib/cors';

/**
 * POST /api/send
 * Send push notifications to subscribed devices
 * 
 * Supports both:
 * - Authorization header: Authorization: Bearer YOUR_API_KEY
 * - Query parameter: ?apikey=YOUR_API_KEY
 * 
 * Body: {
 *   "subscriptionIds"?: string[];
 *   "subscriptionId"?: string;
 *   "notification": { title: string; body: string; icon?: string; badge?: string; image?: string; data?: object }
 * }
 */
export async function POST(request: NextRequest) {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreFlight(request);
  if (preflightResponse) {
    return preflightResponse;
  }

  // Validate API key (supports both header and query param)
  const auth = await validateApiKeyAsync(request);
  if (!auth.valid) {
    return createCorsErrorResponse('Unauthorized: Invalid or missing API key', 401);
  }

  try {
    const body = await request.json();
    const { subscriptionIds, subscriptionId, notification } = body;

    // Validate notification
    if (!notification || !notification.title || !notification.body) {
      return createCorsErrorResponse(
        'Invalid notification: must include title and body',
        400
      );
    }

    // Determine target subscriptions
    let targetIds: string[] = [];

    if (subscriptionId) {
      targetIds = [subscriptionId];
    } else if (Array.isArray(subscriptionIds) && subscriptionIds.length > 0) {
      targetIds = subscriptionIds;
    } else {
      return createCorsErrorResponse(
        'Must provide either subscriptionId or subscriptionIds array',
        400
      );
    }

    // Fetch subscriptions from Firebase
    const subscriptionsRef = ref(database, 'subscriptions');
    const snapshot = await get(subscriptionsRef);

    if (!snapshot.exists()) {
      return createCorsErrorResponse('No subscriptions found', 404);
    }

    const allSubscriptions = snapshot.val();
    const targetSubscriptions: any[] = [];

    for (const id of targetIds) {
      if (allSubscriptions[id]) {
        const subData = allSubscriptions[id];
        
        // If user is not admin, only allow sending to their own subscriptions
        if (auth.email && subData.email && subData.email !== auth.email) {
          console.log(`[v0] User ${auth.email} tried to send to subscription owned by ${subData.email}`);
          continue;
        }
        
        // Reconstruct PushSubscriptionJSON
        targetSubscriptions.push({
          endpoint: subData.endpoint,
          keys: {
            auth: subData.auth,
            p256dh: subData.p256dh,
          },
        });
      }
    }

    if (targetSubscriptions.length === 0) {
      return createCorsErrorResponse(
        `No valid subscriptions found for provided IDs`,
        404
      );
    }

    // Send notifications
    const notificationPayload: PushNotification = {
      title: notification.title,
      body: notification.body,
      icon: notification.icon,
      badge: notification.badge,
      image: notification.image,
      tag: notification.tag,
      data: notification.data,
      actions: notification.actions,
      vibrate: notification.vibrate,
      silent: notification.silent,
      requireInteraction: notification.requireInteraction,
      timestamp: notification.timestamp,
    };

    let result;
    if (targetSubscriptions.length === 1) {
      try {
        await sendPushNotification(targetSubscriptions[0], notificationPayload);
        result = {
          successful: 1,
          failed: 0,
          errors: [],
        };
      } catch (error: any) {
        result = {
          successful: 0,
          failed: 1,
          errors: [error.message],
        };
      }
    } else {
      result = await sendPushNotificationsToMany(
        targetSubscriptions,
        notificationPayload
      );
    }

    return createCorsSuccessResponse({
      message: `Sent ${result.successful} notification(s)`,
      result,
    });
  } catch (error: any) {
    console.error('[v0] Send notification error:', error);
    return createCorsErrorResponse(
      `Failed to send notification: ${error.message}`,
      500
    );
  }
}

/**
 * Handle OPTIONS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}
