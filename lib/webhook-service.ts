import {
  database,
  ref,
  set,
  get,
  remove,
  push,
} from '@/lib/firebase';

/**
 * Webhook Service
 * Manages webhook registration and delivery for call events
 */

export type WebhookEventType =
  | 'participant.joined'
  | 'participant.left'
  | 'call.ended'
  | 'recording.started'
  | 'recording.stopped'
  | 'transcription.segment'
  | 'quality.degraded';

interface WebhookRegistration {
  webhookId: string;
  callId: string;
  url: string;
  events: WebhookEventType[];
  retryPolicy: {
    maxRetries: number;
    retryDelay: number; // milliseconds
  };
  createdAt: string;
  active: boolean;
}

interface WebhookPayload {
  event: WebhookEventType;
  callId: string;
  timestamp: string;
  data: Record<string, any>;
}

interface WebhookDeliveryLog {
  deliveryId: string;
  webhookId: string;
  event: WebhookEventType;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  attempts: number;
  lastAttemptAt?: string;
  nextRetryAt?: string;
  error?: string;
  createdAt: string;
}

/**
 * Generate unique webhook ID
 */
export function generateWebhookId(): string {
  return `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Register a webhook for a call
 */
export async function registerWebhook(
  callId: string,
  url: string,
  events: WebhookEventType[],
  options?: {
    maxRetries?: number;
    retryDelay?: number;
  }
): Promise<{ webhookId: string } | null> {
  try {
    const webhookId = generateWebhookId();
    const now = new Date().toISOString();

    const webhook: WebhookRegistration = {
      webhookId,
      callId,
      url,
      events,
      retryPolicy: {
        maxRetries: options?.maxRetries ?? 3,
        retryDelay: options?.retryDelay ?? 1000,
      },
      createdAt: now,
      active: true,
    };

    const webhookRef = ref(database, `calls/${callId}/webhooks/${webhookId}`);
    await set(webhookRef, webhook);

    // Also create an index for quick access
    const webhookIndexRef = ref(database, `webhooks/${webhookId}`);
    await set(webhookIndexRef, {
      webhookId,
      callId,
      url,
      createdAt: now,
    });

    return { webhookId };
  } catch (error) {
    console.error('[v0] Error registering webhook:', error);
    return null;
  }
}

/**
 * Get all webhooks for a call
 */
export async function getCallWebhooks(callId: string): Promise<WebhookRegistration[]> {
  try {
    const webhooksRef = ref(database, `calls/${callId}/webhooks`);
    const snapshot = await get(webhooksRef);

    if (!snapshot.exists()) {
      return [];
    }

    const webhooks = snapshot.val();
    return Object.values(webhooks).filter((w: any) => w.active) as WebhookRegistration[];
  } catch (error) {
    console.error('[v0] Error getting webhooks:', error);
    return [];
  }
}

/**
 * Delete a webhook
 */
export async function deleteWebhook(callId: string, webhookId: string): Promise<boolean> {
  try {
    const webhookRef = ref(database, `calls/${callId}/webhooks/${webhookId}`);
    await set(webhookRef, { ...((await get(webhookRef)).val() || {}), active: false });

    return true;
  } catch (error) {
    console.error('[v0] Error deleting webhook:', error);
    return false;
  }
}

/**
 * Queue a webhook delivery
 */
export async function queueWebhookDelivery(
  callId: string,
  event: WebhookEventType,
  data: Record<string, any>
): Promise<void> {
  try {
    const webhooks = await getCallWebhooks(callId);
    const interestedWebhooks = webhooks.filter(w => w.events.includes(event));

    if (interestedWebhooks.length === 0) {
      return;
    }

    const payload: WebhookPayload = {
      event,
      callId,
      timestamp: new Date().toISOString(),
      data,
    };

    for (const webhook of interestedWebhooks) {
      const delivery: WebhookDeliveryLog = {
        deliveryId: `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        webhookId: webhook.webhookId,
        event,
        status: 'pending',
        attempts: 0,
        createdAt: new Date().toISOString(),
      };

      const deliveryRef = ref(
        database,
        `webhooks/${webhook.webhookId}/deliveries/${delivery.deliveryId}`
      );
      await set(deliveryRef, delivery);

      // Schedule immediate delivery attempt
      await deliverWebhook(webhook, payload, delivery);
    }
  } catch (error) {
    console.error('[v0] Error queuing webhook delivery:', error);
  }
}

/**
 * Deliver a webhook (with retry logic)
 */
export async function deliverWebhook(
  webhook: WebhookRegistration,
  payload: WebhookPayload,
  delivery: WebhookDeliveryLog
): Promise<void> {
  const updateDeliveryRef = ref(
    database,
    `webhooks/${webhook.webhookId}/deliveries/${delivery.deliveryId}`
  );

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Event': payload.event,
        'X-Call-ID': payload.callId,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      // Success
      await set(updateDeliveryRef, {
        ...delivery,
        status: 'success',
        attempts: delivery.attempts + 1,
        lastAttemptAt: new Date().toISOString(),
      });
      return;
    }

    throw new Error(`HTTP ${response.status}`);
  } catch (error: any) {
    delivery.attempts++;
    const shouldRetry = delivery.attempts < webhook.retryPolicy.maxRetries;

    if (shouldRetry) {
      const nextRetryDelay =
        webhook.retryPolicy.retryDelay * Math.pow(2, delivery.attempts - 1); // Exponential backoff
      const nextRetryAt = new Date(Date.now() + nextRetryDelay).toISOString();

      await set(updateDeliveryRef, {
        ...delivery,
        status: 'retrying',
        attempts: delivery.attempts,
        lastAttemptAt: new Date().toISOString(),
        nextRetryAt,
        error: error.message,
      });

      // In production, schedule this delivery to retry at nextRetryAt
      console.log(
        `[v0] Webhook delivery will retry at ${nextRetryAt}: ${error.message}`
      );
    } else {
      await set(updateDeliveryRef, {
        ...delivery,
        status: 'failed',
        attempts: delivery.attempts,
        lastAttemptAt: new Date().toISOString(),
        error: error.message,
      });

      console.error('[v0] Webhook delivery failed after all retries:', error.message);
    }
  }
}

/**
 * Send a webhook event (convenience function)
 */
export async function sendWebhookEvent(
  callId: string,
  event: WebhookEventType,
  data: Record<string, any>
): Promise<void> {
  await queueWebhookDelivery(callId, event, data);
}
