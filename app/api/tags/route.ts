import { NextRequest, NextResponse } from 'next/server';
import { database, ref, get, set } from '@/lib/firebase';
import { validateApiKeyAsync, createErrorResponse, createSuccessResponse, createUnauthorizedResponse } from '@/lib/api-auth';

/**
 * GET /api/tags
 * Get tags for a subscription
 */
export async function GET(request: NextRequest) {
  try {
    const subscriptionId = request.nextUrl.searchParams.get('subscriptionId');

    if (!subscriptionId) {
      return createErrorResponse('subscriptionId is required', 400);
    }

    const tagsRef = ref(database, `subscriptions/${subscriptionId}/tags`);
    const snapshot = await get(tagsRef);

    const tags = snapshot.exists() ? snapshot.val() : [];

    return createSuccessResponse({ subscriptionId, tags }, 200);
  } catch (error: any) {
    console.error('[v0] Get tags error:', error);
    return createErrorResponse(error.message, 500);
  }
}

/**
 * POST /api/tags
 * Add tags to a subscription (for segmentation/targeting)
 * Requires API key
 */
export async function POST(request: NextRequest) {
  const auth = await validateApiKeyAsync(request);
  if (!auth.valid) {
    return createUnauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { subscriptionId, tags } = body;

    if (!subscriptionId) {
      return createErrorResponse('subscriptionId is required', 400);
    }

    if (!Array.isArray(tags) || tags.length === 0) {
      return createErrorResponse('tags must be a non-empty array', 400);
    }

    // Validate tags are strings
    const validTags = tags.filter((tag: any) => typeof tag === 'string' && tag.trim().length > 0).map((tag: string) => tag.trim().toLowerCase());

    if (validTags.length === 0) {
      return createErrorResponse('at least one valid tag is required', 400);
    }

    // Get existing tags
    const tagsRef = ref(database, `subscriptions/${subscriptionId}/tags`);
    const snapshot = await get(tagsRef);
    const existingTags = snapshot.exists() ? snapshot.val() : [];

    // Merge tags (remove duplicates)
    const mergedTags = Array.from(new Set([...existingTags, ...validTags]));

    // Save updated tags
    await set(tagsRef, mergedTags);

    return createSuccessResponse(
      {
        subscriptionId,
        tags: mergedTags,
        message: `Added ${validTags.length} tag(s)`,
      },
      200
    );
  } catch (error: any) {
    console.error('[v0] Add tags error:', error);
    return createErrorResponse(error.message, 500);
  }
}

/**
 * DELETE /api/tags
 * Remove tags from a subscription
 * Requires API key
 */
export async function DELETE(request: NextRequest) {
  const auth = await validateApiKeyAsync(request);
  if (!auth.valid) {
    return createUnauthorizedResponse();
  }

  try {
    const subscriptionId = request.nextUrl.searchParams.get('subscriptionId');
    const tagsParam = request.nextUrl.searchParams.get('tags');

    if (!subscriptionId) {
      return createErrorResponse('subscriptionId is required', 400);
    }

    if (!tagsParam) {
      return createErrorResponse('tags parameter is required (comma-separated)', 400);
    }

    const tagsToRemove = tagsParam.split(',').map((t) => t.trim().toLowerCase()).filter((t) => t.length > 0);

    const tagsRef = ref(database, `subscriptions/${subscriptionId}/tags`);
    const snapshot = await get(tagsRef);
    const existingTags = snapshot.exists() ? snapshot.val() : [];

    // Remove specified tags
    const updatedTags = existingTags.filter((tag: string) => !tagsToRemove.includes(tag));

    if (updatedTags.length === 0) {
      // Delete the tags node if empty
      await set(tagsRef, null);
    } else {
      await set(tagsRef, updatedTags);
    }

    return createSuccessResponse(
      {
        subscriptionId,
        tags: updatedTags,
        message: `Removed ${existingTags.length - updatedTags.length} tag(s)`,
      },
      200
    );
  } catch (error: any) {
    console.error('[v0] Remove tags error:', error);
    return createErrorResponse(error.message, 500);
  }
}
