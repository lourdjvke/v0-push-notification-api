import { NextRequest, NextResponse } from 'next/server';
import { database, ref, get } from '@/lib/firebase';
import { validateApiKey, createErrorResponse, createSuccessResponse, createUnauthorizedResponse } from '@/lib/api-auth';
import { sendPushNotification, sendPushNotificationsToMany, PushNotification } from '@/lib/push-service';

/**
 * POST /api/send
 * Send push notifications to subscribed devices
 * Requires: Authorization header with API key
 * Body: {
 *   subscriptionIds?: string[];
 *   subscriptionId?: string;
 *   notification: { title: string; body: string; icon?: string; badge?: string; data?: object }
 * }
 */
export async function POST(request: NextRequest) {
  // Validate API key
  const auth = validateApiKey(request);
  if (!auth.valid) {
    return createUnauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { subscriptionIds, subscriptionId, notification } = body;

    // Validate notification
    if (!notification || !notification.title || !notification.body) {
      return createErrorResponse(
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
      return createErrorResponse(
        'Must provide either subscriptionId or subscriptionIds array',
        400
      );
    }

    // Fetch subscriptions from Firebase
    const subscriptionsRef = ref(database, 'subscriptions');
    const snapshot = await get(subscriptionsRef);

    if (!snapshot.exists()) {
      return createErrorResponse('No subscriptions found', 404);
    }

    const allSubscriptions = snapshot.val();
    const targetSubscriptions: any[] = [];

    for (const id of targetIds) {
      if (allSubscriptions[id]) {
        const subData = allSubscriptions[id];
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
      return createErrorResponse(
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
      data: notification.data,
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

    return createSuccessResponse({
      message: `Sent ${result.successful} notification(s)`,
      result,
    });
  } catch (error: any) {
    console.error('[v0] Send notification error:', error);
    return createErrorResponse(
      `Failed to send notification: ${error.message}`,
      500
    );
  }
}
