import { NextRequest } from 'next/server';
import { validateApiKeyAsync } from '@/lib/api-auth';
import { handleCorsPreFlight, createCorsErrorResponse, createCorsSuccessResponse } from '@/lib/cors';
import { addParticipant, getCallState } from '@/lib/call-service';
import { AddParticipantRequestSchema, AddParticipantResponseSchema } from '@/lib/call-schemas';

/**
 * POST /api/calls/:callId/participants
 * Add a participant to an active call
 * 
 * Body:
 * {
 *   "userId": "string (required)",
 *   "userName": "string (optional)",
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

    // Parse and validate request body
    const body = await request.json();
    const validation = AddParticipantRequestSchema.safeParse(body);

    if (!validation.success) {
      return createCorsErrorResponse(
        `Invalid request: ${validation.error.message}`,
        400
      );
    }

    const { userId, userName, metadata } = validation.data;

    // Check if call exists and is active
    const callState = await getCallState(callId);
    if (!callState) {
      return createCorsErrorResponse('Call not found', 404);
    }

    if (callState.status !== 'active') {
      return createCorsErrorResponse('Call is no longer active', 400);
    }

    // Check if we're at max participants
    if (callState.participantCount >= callState.maxParticipants) {
      return createCorsErrorResponse(
        `Call is at maximum participants (${callState.maxParticipants})`,
        400
      );
    }

    // Add the participant
    const result = await addParticipant(callId, userId, userName, metadata);

    if (!result) {
      return createCorsErrorResponse('Failed to add participant', 500);
    }

    // Validate response schema
    const responseValidation = AddParticipantResponseSchema.safeParse({
      participantId: result.participantId,
      joinToken: result.token,
      expiresIn: result.expiresIn,
    });

    if (!responseValidation.success) {
      console.error('[v0] Response validation failed:', responseValidation.error);
      return createCorsErrorResponse('Internal server error', 500);
    }

    return createCorsSuccessResponse(responseValidation.data, 201);
  } catch (error: any) {
    console.error('[v0] Add participant error:', error);
    return createCorsErrorResponse(
      `Failed to add participant: ${error.message}`,
      500
    );
  }
}

/**
 * GET /api/calls/:callId/participants
 * List all participants in a call
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

    return createCorsSuccessResponse({
      callId,
      participantCount: callState.participantCount,
      participants: callState.participants || [],
    });
  } catch (error: any) {
    console.error('[v0] Get participants error:', error);
    return createCorsErrorResponse(
      `Failed to get participants: ${error.message}`,
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
