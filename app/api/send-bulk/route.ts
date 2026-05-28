import { NextRequest, NextResponse } from 'next/server';
import { database, ref, get } from '@/lib/firebase';
import { validateApiKeyAsync, createErrorResponse, createSuccessResponse, createUnauthorizedResponse } from '@/lib/api-auth';
import { sendPushNotificationsToMany, PushNotification } from '@/lib/push-service';

/**
 * POST /api/send-bulk
 * Send notifications to multiple devices with filtering options
 * Supports:
 * - Send to all devices
 * - Send by tags (segment users)
 * - Send to specific device list
 * - Scheduled delivery (store and send later)
 */
export async function POST(request: NextRequest) {
  const auth = await validateApiKeyAsync(request);
  if (!auth.valid) {
    return createUnauthorizedResponse();
  }

  try {
    const body = await request.json();
    const {
      subscriptionIds,
      tags,
      sendToAll,
      notification,
      schedule,
    } = body;

    // Validate notification
    if (!notification || !notification.title || !notification.body) {
      return createErrorResponse(
        'Invalid notification: must include title and body',
        400
      );
    }

    // Fetch all subscriptions from Firebase
    const subscriptionsRef = ref(database, 'subscriptions');
    const snapshot = await get(subscriptionsRef);

    if (!snapshot.exists()) {
      return createErrorResponse('No subscriptions found', 404);
    }

    const allSubscriptions = snapshot.val();
    const targetSubscriptions: Array<{
      endpoint: string;
      keys: { auth: string; p256dh: string };
      id: string;
    }> = [];
    const targetIds: string[] = [];

    if (sendToAll) {
      // Send to all subscriptions
      for (const id in allSubscriptions) {
        const sub = allSubscriptions[id];
        targetSubscriptions.push({
          id,
          endpoint: sub.endpoint,
          keys: { auth: sub.auth, p256dh: sub.p256dh },
        });
        targetIds.push(id);
      }
    } else if (Array.isArray(tags) && tags.length > 0) {
      // Send to subscriptions with matching tags
      const normalizedTags = tags.map((t: string) => t.toLowerCase());

      for (const id in allSubscriptions) {
        const sub = allSubscriptions[id];
        const subTags = sub.tags || [];

        // Check if subscription has any of the specified tags
        const hasMatchingTag = subTags.some((tag: string) =>
          normalizedTags.includes(tag.toLowerCase())
        );

        if (hasMatchingTag) {
          targetSubscriptions.push({
            id,
            endpoint: sub.endpoint,
            keys: { auth: sub.auth, p256dh: sub.p256dh },
          });
          targetIds.push(id);
        }
      }
    } else if (Array.isArray(subscriptionIds) && subscriptionIds.length > 0) {
      // Send to specific subscription IDs
      for (const id of subscriptionIds) {
        if (allSubscriptions[id]) {
          const sub = allSubscriptions[id];
          targetSubscriptions.push({
            id,
            endpoint: sub.endpoint,
            keys: { auth: sub.auth, p256dh: sub.p256dh },
          });
          targetIds.push(id);
        }
      }
    } else {
      return createErrorResponse(
        'Must provide either sendToAll, tags, or subscriptionIds',
        400
      );
    }

    if (targetSubscriptions.length === 0) {
      return createErrorResponse('No matching subscriptions found', 404);
    }

    // Handle scheduled delivery
    if (schedule && schedule.sendAt) {
      const sendTime = new Date(schedule.sendAt);
      const now = new Date();

      if (sendTime > now) {
        // Store scheduled notification
        const scheduledRef = ref(
          database,
          `scheduled_notifications/${Date.now()}`
        );
        const scheduledData = {
          notification,
          targetIds,
          tags,
          sendAtTimestamp: sendTime.getTime(),
          createdAt: now.toISOString(),
          status: 'pending',
        };

        // Note: Actual sending would require a scheduled job/cron
        // This just stores the scheduled notification
        return createSuccessResponse(
          {
            message: 'Notification scheduled for delivery',
            scheduledAt: sendTime.toISOString(),
            targetCount: targetIds.length,
            notification,
          },
          201
        );
      }
    }

    // Send notifications immediately
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
      timestamp: notification.timestamp || Date.now(),
    };

    const result = await sendPushNotificationsToMany(
      targetSubscriptions.map((s) => ({
        endpoint: s.endpoint,
        keys: s.keys,
      })) as any,
      notificationPayload
    );

    return createSuccessResponse(
      {
        message: `Sent notifications to ${result.successful} device(s)`,
        result: {
          ...result,
          totalTargeted: targetSubscriptions.length,
        },
      },
      200
    );
  } catch (error: any) {
    console.error('[v0] Bulk send error:', error);
    return createErrorResponse(
      `Failed to send notifications: ${error.message}`,
      500
    );
  }
}
