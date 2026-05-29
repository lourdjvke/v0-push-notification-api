import { NextRequest } from 'next/server';
import { database, ref, get } from '@/lib/firebase';
import { validateApiKeyAsync } from '@/lib/api-auth';
import { handleCorsPreFlight, createCorsErrorResponse, createCorsSuccessResponse } from '@/lib/cors';

/**
 * GET /api/analytics/by-key?apikey=KEY
 * Get all subscribers for a specific API key with their details
 */
export async function GET(request: NextRequest) {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreFlight(request);
  if (preflightResponse) {
    return preflightResponse;
  }

  try {
    // Validate API key
    const validation = await validateApiKeyAsync(request);
    if (!validation.valid) {
      return createCorsErrorResponse('Unauthorized: Invalid or missing API key', 401);
    }

    // Get the API key from request
    let apiKey = request.nextUrl.searchParams.get('apikey');
    if (!apiKey && request.headers.get('Authorization')) {
      const authHeader = request.headers.get('Authorization') || '';
      apiKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    }

    // Get all subscriptions
    const subscriptionsRef = ref(database, 'subscriptions');
    const snapshot = await get(subscriptionsRef);

    if (!snapshot.exists()) {
      return createCorsSuccessResponse({
        apiKey: apiKey || 'unknown',
        subscriberCount: 0,
        subscribers: [],
        totalStats: {
          notificationsReceived: 0,
          notificationsOpened: 0,
          notificationsClicked: 0,
        },
      });
    }

    const allSubscriptions = snapshot.val();
    const subscribers: any[] = [];
    let totalStats = {
      notificationsReceived: 0,
      notificationsOpened: 0,
      notificationsClicked: 0,
    };

    // Filter subscriptions for this API key
    for (const [subscriptionId, subData] of Object.entries(allSubscriptions)) {
      // Check if subscription matches this API key
      // Subscriptions can be linked by:
      // 1. Direct apiKey match in the subscription data
      // 2. Email match (for backwards compatibility)
      const isOwnSubscription = 
        (apiKey && subData.apiKey === apiKey) ||
        (validation.email && subData.email === validation.email);

      if (!isOwnSubscription) {
        continue;
      }

      const subscriber = {
        subscriptionId,
        deviceName: subData.deviceName || 'Unknown Device',
        userAgent: subData.userAgent || 'Unknown',
        subscribedAt: subData.subscribedAt,
        email: subData.email,
        stats: {
          notificationsReceived: subData.stats?.notificationsReceived || 0,
          notificationsOpened: subData.stats?.notificationsOpened || 0,
          notificationsClicked: subData.stats?.notificationsClicked || 0,
        },
      };

      subscribers.push(subscriber);

      // Aggregate stats
      totalStats.notificationsReceived += subscriber.stats.notificationsReceived;
      totalStats.notificationsOpened += subscriber.stats.notificationsOpened;
      totalStats.notificationsClicked += subscriber.stats.notificationsClicked;
    }

    console.log('[v0] Analytics found', subscribers.length, 'subscribers');

    return createCorsSuccessResponse({
      apiKey: apiKey || 'unknown',
      subscriberCount: subscribers.length,
      subscribers: subscribers.sort((a, b) => 
        new Date(b.subscribedAt).getTime() - new Date(a.subscribedAt).getTime()
      ),
      totalStats,
      engagementRate: totalStats.notificationsReceived > 0
        ? ((totalStats.notificationsOpened + totalStats.notificationsClicked) / totalStats.notificationsReceived * 100).toFixed(2)
        : '0',
    });
  } catch (error: any) {
    console.error('[v0] Get analytics by key error:', error);
    return createCorsErrorResponse(`Failed to retrieve analytics: ${error.message}`, 500);
  }
}

/**
 * Handle OPTIONS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}
