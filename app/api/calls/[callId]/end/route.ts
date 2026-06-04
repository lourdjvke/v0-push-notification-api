import { NextRequest } from 'next/server';
import { validateApiKeyAsync } from '@/lib/api-auth';
import { handleCorsPreFlight, createCorsErrorResponse, createCorsSuccessResponse } from '@/lib/cors';
import { endCall, getCallState } from '@/lib/call-service';
import { EndCallRequestSchema } from '@/lib/call-schemas';

/**
 * POST /api/calls/:callId/end
 * Gracefully terminate a call
 * 
 * Body (optional):
 * {
 *   "reason": "string (optional)",
 *   "metadata": object (optional)
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

    // Parse and validate request body (optional)
    let endRequest: any = {};
    try {
      const body = await request.json();
      const validation = EndCallRequestSchema.safeParse(body);
      if (validation.success) {
        endRequest = validation.data;
      }
    } catch {
      // Body is optional, continue without it
    }

    // Get current call state before ending
    const currentState = await getCallState(callId);
    if (!currentState) {
      return createCorsErrorResponse('Call not found', 404);
    }

    // End the call
    const success = await endCall(callId, endRequest);

    if (!success) {
      return createCorsErrorResponse('Failed to end call', 500);
    }

    // Return the final call state
    const finalState = await getCallState(callId);

    return createCorsSuccessResponse({
      message: 'Call ended successfully',
      callId,
      callState: finalState,
    });
  } catch (error: any) {
    console.error('[v0] End call error:', error);
    return createCorsErrorResponse(
      `Failed to end call: ${error.message}`,
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
