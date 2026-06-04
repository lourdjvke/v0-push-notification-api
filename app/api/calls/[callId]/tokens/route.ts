import { NextRequest } from 'next/server';
import { validateApiKeyAsync } from '@/lib/api-auth';
import { handleCorsPreFlight, createCorsErrorResponse, createCorsSuccessResponse } from '@/lib/cors';
import { generateNewParticipantToken, getCallState } from '@/lib/call-service';
import { GenerateTokenRequestSchema, GenerateTokenResponseSchema } from '@/lib/call-schemas';

/**
 * POST /api/calls/:callId/tokens
 * Generate additional tokens for new participants joining an active call
 * 
 * Body:
 * {
 *   "participantId": "string (required)"
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
    const validation = GenerateTokenRequestSchema.safeParse(body);

    if (!validation.success) {
      return createCorsErrorResponse(
        `Invalid request: ${validation.error.message}`,
        400
      );
    }

    const { participantId } = validation.data;

    // Check if call exists
    const callState = await getCallState(callId);
    if (!callState) {
      return createCorsErrorResponse('Call not found', 404);
    }

    if (callState.status !== 'active') {
      return createCorsErrorResponse('Call is no longer active', 400);
    }

    // Generate new token for the participant
    const tokenResult = await generateNewParticipantToken(callId, participantId);

    if (!tokenResult) {
      return createCorsErrorResponse('Participant not found or token generation failed', 404);
    }

    // Validate response schema
    const responseValidation = GenerateTokenResponseSchema.safeParse({
      token: tokenResult.token,
      participantId,
      expiresIn: tokenResult.expiresIn,
    });

    if (!responseValidation.success) {
      console.error('[v0] Response validation failed:', responseValidation.error);
      return createCorsErrorResponse('Internal server error', 500);
    }

    return createCorsSuccessResponse(responseValidation.data);
  } catch (error: any) {
    console.error('[v0] Generate token error:', error);
    return createCorsErrorResponse(
      `Failed to generate token: ${error.message}`,
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
