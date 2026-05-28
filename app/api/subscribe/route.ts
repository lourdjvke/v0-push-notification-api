import { NextRequest, NextResponse } from 'next/server';
import { database, ref, set, get } from '@/lib/firebase';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-auth';

/**
 * POST /api/subscribe
 * Subscribe a device to push notifications (no auth required for client subscriptions)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription, deviceName } = body;

    if (!subscription || !subscription.endpoint) {
      return createErrorResponse('Invalid subscription data', 400);
    }

    // Generate a unique subscription ID
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store subscription in Firebase RTDB
    const subscriptionRef = ref(database, `subscriptions/${subscriptionId}`);
    
    await set(subscriptionRef, {
      id: subscriptionId,
      endpoint: subscription.endpoint,
      auth: subscription.keys?.auth,
      p256dh: subscription.keys?.p256dh,
      deviceName: deviceName || 'Unknown Device',
      userAgent: request.headers.get('user-agent'),
      subscribedAt: new Date().toISOString(),
      expirationTime: subscription.expirationTime,
    });

    return createSuccessResponse(
      {
        message: 'Successfully subscribed to push notifications',
        subscriptionId,
        subscription,
      },
      201
    );
  } catch (error: any) {
    console.error('[v0] Subscribe error:', error);
    return createErrorResponse(`Subscription failed: ${error.message}`, 500);
  }
}

/**
 * GET /api/subscribe
 * Get all subscriptions (requires API key)
 */
export async function GET(request: NextRequest) {
  try {
    // Check for API key for bulk operations
    const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '');
    const validKeys = process.env.PUSH_API_KEYS ? process.env.PUSH_API_KEYS.split(',').map(k => k.trim()) : ['test-api-key-12345'];
    
    if (!apiKey || !validKeys.includes(apiKey)) {
      return createErrorResponse('Unauthorized', 401);
    }

    const subscriptionsRef = ref(database, 'subscriptions');
    const snapshot = await get(subscriptionsRef);

    if (!snapshot.exists()) {
      return createSuccessResponse({
        message: 'No subscriptions found',
        subscriptions: [],
        count: 0,
      });
    }

    const subscriptions = snapshot.val();
    const subscriptionList = Object.entries(subscriptions).map(([id, data]: any) => ({
      id,
      ...data,
    }));

    return createSuccessResponse({
      message: 'Subscriptions retrieved successfully',
      subscriptions: subscriptionList,
      count: subscriptionList.length,
    });
  } catch (error: any) {
    console.error('[v0] Get subscriptions error:', error);
    return createErrorResponse(`Failed to retrieve subscriptions: ${error.message}`, 500);
  }
}
