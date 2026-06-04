import { NextRequest, NextResponse } from 'next/server';
import { validateApiKeyAsync } from '@/lib/api-auth';
import { handleCorsPreFlight, createCorsErrorResponse, createCorsSuccessResponse } from '@/lib/cors';
import { getCallState } from '@/lib/call-service';
import { CallStateSchema } from '@/lib/call-schemas';

/**
 * GET /api/calls/:callId/state
 * Retrieve current call state (participants, duration, quality metrics)
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

    // Get call state
    const callState = await getCallState(callId);

    if (!callState) {
      return createCorsErrorResponse('Call not found', 404);
    }

    // Validate response schema
    const validation = CallStateSchema.safeParse(callState);
    if (!validation.success) {
      console.error('[v0] Response validation failed:', validation.error);
      return createCorsErrorResponse('Internal server error', 500);
    }

    return createCorsSuccessResponse(validation.data);
  } catch (error: any) {
    console.error('[v0] Get call state error:', error);
    return createCorsErrorResponse(
      `Failed to get call state: ${error.message}`,
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
