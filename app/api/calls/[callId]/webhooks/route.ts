import { NextRequest } from 'next/server';
import { validateApiKeyAsync } from '@/lib/api-auth';
import { handleCorsPreFlight, createCorsErrorResponse, createCorsSuccessResponse } from '@/lib/cors';
import { registerWebhook, getCallWebhooks, deleteWebhook } from '@/lib/webhook-service';
import { getCallState } from '@/lib/call-service';
import { WebhookRegistrationSchema } from '@/lib/call-schemas';

/**
 * POST /api/calls/:callId/webhooks
 * Register a webhook for call events
 * 
 * Body:
 * {
 *   "url": "string (required) - webhook URL",
 *   "events": ["participant.joined", ...] (required),
 *   "retryPolicy": {
 *     "maxRetries": number (optional, default: 3),
 *     "retryDelay": number (optional, default: 1000ms)
 *   } (optional)
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreFlight(request);
  if (preflightResponse) {
    return preflightResponse;
  }

  try {
    // Validate API key
    const auth = await validateApiKeyAsync(request);
    if (!auth.valid) {
      return createCorsErrorResponse('Unauthorized: Invalid or missing API key', 401);
    }

    const { callId } = await params;

    if (!callId) {
      return createCorsErrorResponse('Missing callId parameter', 400);
    }

    // Check if call exists
    const callState = await getCallState(callId);
    if (!callState) {
      return createCorsErrorResponse('Call not found', 404);
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = WebhookRegistrationSchema.safeParse(body);

    if (!validation.success) {
      return createCorsErrorResponse(
        `Invalid request: ${validation.error.message}`,
        400
      );
    }

    const { url, events, retryPolicy } = validation.data;

    // Register the webhook
    const result = await registerWebhook(callId, url, events, {
      maxRetries: retryPolicy?.maxRetries,
      retryDelay: retryPolicy?.retryDelay,
    });

    if (!result) {
      return createCorsErrorResponse('Failed to register webhook', 500);
    }

    return createCorsSuccessResponse(
      {
        message: 'Webhook registered successfully',
        webhookId: result.webhookId,
        callId,
        url,
        events,
      },
      201
    );
  } catch (error: any) {
    console.error('[v0] Register webhook error:', error);
    return createCorsErrorResponse(
      `Failed to register webhook: ${error.message}`,
      500
    );
  }
}

/**
 * GET /api/calls/:callId/webhooks
 * List all registered webhooks for a call
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreFlight(request);
  if (preflightResponse) {
    return preflightResponse;
  }

  try {
    // Validate API key
    const auth = await validateApiKeyAsync(request);
    if (!auth.valid) {
      return createCorsErrorResponse('Unauthorized: Invalid or missing API key', 401);
    }

    const { callId } = await params;

    if (!callId) {
      return createCorsErrorResponse('Missing callId parameter', 400);
    }

    // Get webhooks
    const webhooks = await getCallWebhooks(callId);

    return createCorsSuccessResponse({
      callId,
      webhooks,
      count: webhooks.length,
    });
  } catch (error: any) {
    console.error('[v0] Get webhooks error:', error);
    return createCorsErrorResponse(
      `Failed to get webhooks: ${error.message}`,
      500
    );
  }
}

/**
 * DELETE /api/calls/:callId/webhooks/:webhookId
 * Unregister a webhook
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreFlight(request);
  if (preflightResponse) {
    return preflightResponse;
  }

  try {
    // Validate API key
    const auth = await validateApiKeyAsync(request);
    if (!auth.valid) {
      return createCorsErrorResponse('Unauthorized: Invalid or missing API key', 401);
    }

    const { callId } = await params;
    const webhookId = request.nextUrl.searchParams.get('webhookId');

    if (!callId || !webhookId) {
      return createCorsErrorResponse('Missing callId or webhookId parameter', 400);
    }

    // Delete webhook
    const success = await deleteWebhook(callId, webhookId);

    if (!success) {
      return createCorsErrorResponse('Failed to delete webhook', 500);
    }

    return createCorsSuccessResponse({
      message: 'Webhook deleted successfully',
      webhookId,
    });
  } catch (error: any) {
    console.error('[v0] Delete webhook error:', error);
    return createCorsErrorResponse(
      `Failed to delete webhook: ${error.message}`,
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
