import { NextRequest, NextResponse } from 'next/server';
import { database, ref, set, get } from '@/lib/firebase';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-auth';

/**
 * POST /api/analytics
 * Track notification events (sent, delivered, opened, clicked, closed)
 * Can be called from the service worker or client
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type, // 'sent', 'delivered', 'opened', 'clicked', 'closed'
      subscriptionId,
      notificationId,
      actionId,
      timestamp,
    } = body;

    if (!type || !subscriptionId) {
      return createErrorResponse('type and subscriptionId are required', 400);
    }

    const validTypes = ['sent', 'delivered', 'opened', 'clicked', 'closed'];
    if (!validTypes.includes(type)) {
      return createErrorResponse(`type must be one of: ${validTypes.join(', ')}`, 400);
    }

    // Store event
    const eventId = `${subscriptionId}_${type}_${Date.now()}`;
    const analyticsRef = ref(database, `analytics/${subscriptionId}/${eventId}`);

    const eventData = {
      type,
      subscriptionId,
      notificationId: notificationId || null,
      actionId: actionId || null,
      timestamp: timestamp || new Date().toISOString(),
    };

    await set(analyticsRef, eventData);

    // Update subscription statistics
    const statsRef = ref(database, `subscriptions/${subscriptionId}/stats`);
    const statsSnapshot = await get(statsRef);
    const currentStats = statsSnapshot.exists()
      ? statsSnapshot.val()
      : {
        notificationsReceived: 0,
        notificationsOpened: 0,
        notificationsClicked: 0,
      };

    if (type === 'delivered') {
      currentStats.notificationsReceived = (currentStats.notificationsReceived || 0) + 1;
    } else if (type === 'opened') {
      currentStats.notificationsOpened = (currentStats.notificationsOpened || 0) + 1;
    } else if (type === 'clicked') {
      currentStats.notificationsClicked = (currentStats.notificationsClicked || 0) + 1;
    }

    currentStats.lastActivityAt = new Date().toISOString();

    await set(statsRef, currentStats);

    return createSuccessResponse(
      {
        message: `Event tracked: ${type}`,
        eventId,
      },
      200
    );
  } catch (error: any) {
    console.error('[v0] Analytics error:', error);
    return createErrorResponse(error.message, 500);
  }
}

/**
 * GET /api/analytics
 * Get analytics for a specific subscription
 */
export async function GET(request: NextRequest) {
  try {
    const subscriptionId = request.nextUrl.searchParams.get('subscriptionId');

    if (!subscriptionId) {
      return createErrorResponse('subscriptionId is required', 400);
    }

    // Get subscription stats
    const statsRef = ref(database, `subscriptions/${subscriptionId}/stats`);
    const statsSnapshot = await get(statsRef);
    const stats = statsSnapshot.exists()
      ? statsSnapshot.val()
      : {
        notificationsReceived: 0,
        notificationsOpened: 0,
        notificationsClicked: 0,
      };

    // Get recent events
    const eventsRef = ref(database, `analytics/${subscriptionId}`);
    const eventsSnapshot = await get(eventsRef);
    const events = eventsSnapshot.exists()
      ? Object.entries(eventsSnapshot.val()).map(([id, data]) => ({
        id,
        ...data,
      }))
      : [];

    // Sort events by timestamp (most recent first)
    events.sort((a, b) => {
      const timeA = new Date(a.timestamp as string).getTime();
      const timeB = new Date(b.timestamp as string).getTime();
      return timeB - timeA;
    });

    return createSuccessResponse(
      {
        subscriptionId,
        stats,
        recentEvents: events.slice(0, 50), // Return last 50 events
        engagementRate: stats.notificationsReceived > 0
          ? ((stats.notificationsOpened + stats.notificationsClicked) / stats.notificationsReceived * 100).toFixed(2)
          : '0',
      },
      200
    );
  } catch (error: any) {
    console.error('[v0] Get analytics error:', error);
    return createErrorResponse(error.message, 500);
  }
}
