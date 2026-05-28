import * as webpush from 'web-push';

const vapidPublicKey = "BGLbLfrYWC5npSRnE1QrNXZQrvnlkLommK6OvZUeUNrNKpFbKTFQkLvT0_19CiYeXsHGMs7DdAGPErC25BLTaPA";
const vapidPrivateKey = "tNSV_sKfaT_2NiRDZIM2F_yAEt6iPgX7JL-EmcGg44Q";
const vapidSubject = "mailto:powercomssocials@gmail.com";

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  vapidSubject,
  vapidPublicKey,
  vapidPrivateKey
);

export interface NotificationAction {
  id: string;
  title: string;
  icon?: string;
}

export interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: Record<string, any>;
  actions?: NotificationAction[];
  vibrate?: number[];
  silent?: boolean;
  requireInteraction?: boolean;
  timestamp?: number;
}

export interface PushPayload {
  subscriptionIds?: string[];
  subscriptionId?: string;
  notification: PushNotification;
}

/**
 * Send push notification to a single subscription
 */
export async function sendPushNotification(
  subscription: PushSubscriptionJSON,
  notification: PushNotification
): Promise<void> {
  try {
    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon,
      badge: notification.badge,
      image: notification.image,
      tag: notification.tag,
      data: notification.data || {},
      actions: notification.actions || [],
      vibrate: notification.vibrate,
      silent: notification.silent || false,
      requireInteraction: notification.requireInteraction || false,
      timestamp: notification.timestamp || Date.now(),
    });

    await webpush.sendNotification(subscription as any, payload);
  } catch (error: any) {
    console.error('[v0] Push notification error:', error.message);
    throw error;
  }
}

/**
 * Send push notification to multiple subscriptions
 */
export async function sendPushNotificationsToMany(
  subscriptions: PushSubscriptionJSON[],
  notification: PushNotification
): Promise<{ successful: number; failed: number; errors: string[] }> {
  const results = {
    successful: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const subscription of subscriptions) {
    try {
      await sendPushNotification(subscription, notification);
      results.successful++;
    } catch (error: any) {
      results.failed++;
      results.errors.push(error.message);
    }
  }

  return results;
}

export function getVapidPublicKey(): string {
  return vapidPublicKey;
}
