import { NextRequest, NextResponse } from 'next/server';
import { database, ref, remove } from '@/lib/firebase';
import { validateApiKeyAsync, createErrorResponse, createSuccessResponse } from '@/lib/api-auth';
import { handleCorsPreFlight, createCorsErrorResponse, createCorsSuccessResponse } from '@/lib/cors';

/**
 * DELETE /api/unsubscribe?id=subscriptionId
 * Unsubscribe a device from push notifications
 * Can be called with or without API key (for user deletion)
 */
export async function DELETE(request: NextRequest) {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreFlight(request);
  if (preflightResponse) {
    return preflightResponse;
  }

  try {
    const subscriptionId = request.nextUrl.searchParams.get('id');

    if (!subscriptionId) {
      return createCorsErrorResponse('Missing subscription ID', 400);
    }

    // Delete from Firebase
    const subscriptionRef = ref(database, `subscriptions/${subscriptionId}`);
    await remove(subscriptionRef);

    return createCorsSuccessResponse({
      message: 'Successfully unsubscribed',
      subscriptionId,
    });
  } catch (error: any) {
    console.error('[v0] Unsubscribe error:', error);
    return createCorsErrorResponse(
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
  // Handle CORS preflight
  const preflightResponse = handleCorsPreFlight(request);
  if (preflightResponse) {
    return preflightResponse;
  }

  // Validate API key
  const auth = await validateApiKeyAsync(request);
  if (!auth.valid) {
    return createCorsErrorResponse('Unauthorized: Invalid or missing API key', 401);
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
      return createCorsErrorResponse(
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

    return createCorsSuccessResponse({
      message: `Successfully deleted ${deletedCount} subscription(s)`,
      deletedCount,
    });
  } catch (error: any) {
    console.error('[v0] Bulk unsubscribe error:', error);
    return createCorsErrorResponse(
      `Failed to delete subscriptions: ${error.message}`,
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
