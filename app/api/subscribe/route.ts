import { NextRequest, NextResponse } from 'next/server';
import { database, ref, set, get } from '@/lib/firebase';
import { createErrorResponse, createSuccessResponse, validateApiKeyAsync } from '@/lib/api-auth';
import { handleCorsPreFlight, createCorsErrorResponse, createCorsSuccessResponse } from '@/lib/cors';

/**
 * POST /api/subscribe
 * Subscribe a device to push notifications
 * 
 * Body:
 * {
 *   "subscription": { PushSubscriptionJSON },
 *   "deviceName": "optional device name",
 *   "apikey": "optional API key for linking to user"
 * }
 */
export async function POST(request: NextRequest) {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreFlight(request);
  if (preflightResponse) {
    return preflightResponse;
  }

  try {
    const body = await request.json();
    let { subscription, deviceName, apikey } = body;

    if (!subscription || !subscription.endpoint) {
      return createCorsErrorResponse('Invalid subscription data', 400);
    }

    // Also check for API key in query params or headers
    if (!apikey) {
      apikey = request.nextUrl.searchParams.get('apikey');
    }
    if (!apikey && request.headers.get('Authorization')) {
      const authHeader = request.headers.get('Authorization') || '';
      apikey = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    }

    console.log('[v0] Subscribe request - API Key present:', !!apikey);

    // Generate a unique subscription ID
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const subscriptionData: any = {
      id: subscriptionId,
      endpoint: subscription.endpoint,
      auth: subscription.keys?.auth,
      p256dh: subscription.keys?.p256dh,
      deviceName: deviceName || 'Unknown Device',
      userAgent: request.headers.get('user-agent'),
      subscribedAt: new Date().toISOString(),
    };

    // Only add expirationTime if it exists (Firebase doesn't accept undefined)
    if (subscription.expirationTime) {
      subscriptionData.expirationTime = subscription.expirationTime;
    }

    // If API key is provided, save it directly
    if (apikey) {
      subscriptionData.apiKey = apikey;
      console.log('[v0] Subscription linked to API key:', apikey.substring(0, 10) + '...');
      
      // Also try to get email for backwards compatibility
      try {
        const validation = await validateApiKeyAsync(request);
        if (validation.valid && validation.email) {
          subscriptionData.email = validation.email;
        }
      } catch (error: any) {
        console.log('[v0] Could not validate API key for email:', error.message);
        // Continue anyway - subscription is still valid
      }
    }

    // Store subscription in Firebase RTDB
    const subscriptionRef = ref(database, `subscriptions/${subscriptionId}`);
    
    await set(subscriptionRef, subscriptionData);

    console.log('[v0] Subscription saved with ID:', subscriptionId);

    // If API key exists, also store under api-key index for faster lookups
    if (apikey) {
      const keyIndexRef = ref(database, `subscriptions_by_key/${apikey}/${subscriptionId}`);
      await set(keyIndexRef, {
        subscriptionId,
        subscribedAt: subscriptionData.subscribedAt,
      });
    }

    return createCorsSuccessResponse(
      {
        message: 'Successfully subscribed to push notifications',
        subscriptionId,
        subscription,
      },
      201
    );
  } catch (error: any) {
    console.error('[v0] Subscribe error:', error);
    return createCorsErrorResponse(`Subscription failed: ${error.message}`, 500);
  }
}

/**
 * GET /api/subscribe
 * Get all subscriptions (requires API key)
 */
export async function GET(request: NextRequest) {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreFlight(request);
  if (preflightResponse) {
    return preflightResponse;
  }

  try {
    // Check for API key for bulk operations
    const validation = await validateApiKeyAsync(request);
    
    if (!validation.valid) {
      return createCorsErrorResponse('Unauthorized: Invalid or missing API key', 401);
    }

    const subscriptionsRef = ref(database, 'subscriptions');
    const snapshot = await get(subscriptionsRef);

    if (!snapshot.exists()) {
      return createCorsSuccessResponse({
        message: 'No subscriptions found',
        subscriptions: [],
        count: 0,
      });
    }

    const subscriptions = snapshot.val();
    let subscriptionList = Object.entries(subscriptions).map(([id, data]: any) => ({
      id,
      ...data,
    }));

    // If user email is available, filter to only their subscriptions
    if (validation.email) {
      subscriptionList = subscriptionList.filter(
        (sub: any) => sub.email === validation.email
      );
    }

    return createCorsSuccessResponse({
      message: 'Subscriptions retrieved successfully',
      subscriptions: subscriptionList,
      count: subscriptionList.length,
    });
  } catch (error: any) {
    console.error('[v0] Get subscriptions error:', error);
    return createCorsErrorResponse(`Failed to retrieve subscriptions: ${error.message}`, 500);
  }
}

/**
 * Handle OPTIONS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}
