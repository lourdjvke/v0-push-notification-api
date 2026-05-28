import { NextRequest, NextResponse } from 'next/server';
import { database, ref, remove } from '@/lib/firebase';
import { validateApiKey, createErrorResponse, createSuccessResponse, createUnauthorizedResponse } from '@/lib/api-auth';

/**
 * DELETE /api/unsubscribe?id=subscriptionId
 * Unsubscribe a device from push notifications
 * Can be called with or without API key (for user deletion)
 */
export async function DELETE(request: NextRequest) {
  try {
    const subscriptionId = request.nextUrl.searchParams.get('id');

    if (!subscriptionId) {
      return createErrorResponse('Missing subscription ID', 400);
    }

    // Delete from Firebase
    const subscriptionRef = ref(database, `subscriptions/${subscriptionId}`);
    await remove(subscriptionRef);

    return createSuccessResponse({
      message: 'Successfully unsubscribed',
      subscriptionId,
    });
  } catch (error: any) {
    console.error('[v0] Unsubscribe error:', error);
    return createErrorResponse(
      `Failed to unsubscribe: ${error.message}`,
      500
    );
  }
}

/**
 * POST /api/unsubscribe
 * Bulk unsubscribe or delete subscriptions
 * Requires API key
 */
export async function POST(request: NextRequest) {
  // Validate API key
  const auth = validateApiKey(request);
  if (!auth.valid) {
    return createUnauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { subscriptionId, subscriptionIds } = body;

    let targetIds: string[] = [];

    if (subscriptionId) {
      targetIds = [subscriptionId];
    } else if (Array.isArray(subscriptionIds)) {
      targetIds = subscriptionIds;
    } else {
      return createErrorResponse(
        'Must provide subscriptionId or subscriptionIds array',
        400
      );
    }

    // Delete all specified subscriptions
    let deletedCount = 0;
    for (const id of targetIds) {
      const subscriptionRef = ref(database, `subscriptions/${id}`);
      await remove(subscriptionRef);
      deletedCount++;
    }

    return createSuccessResponse({
      message: `Successfully deleted ${deletedCount} subscription(s)`,
      deletedCount,
    });
  } catch (error: any) {
    console.error('[v0] Bulk unsubscribe error:', error);
    return createErrorResponse(
      `Failed to delete subscriptions: ${error.message}`,
      500
    );
  }
}
