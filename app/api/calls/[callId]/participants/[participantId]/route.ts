import { NextRequest } from 'next/server';
import { validateApiKeyAsync } from '@/lib/api-auth';
import { handleCorsPreFlight, createCorsErrorResponse, createCorsSuccessResponse } from '@/lib/cors';
import { updateParticipant, removeParticipant, getCallState } from '@/lib/call-service';
import { UpdateParticipantRequestSchema } from '@/lib/call-schemas';

/**
 * PATCH /api/calls/:callId/participants/:participantId
 * Control individual participant streams (audio, video, screen share)
 * 
 * Body:
 * {
 *   "audioEnabled": boolean (optional),
 *   "videoEnabled": boolean (optional),
 *   "screenShareEnabled": boolean (optional)
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string; participantId: string }> }
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

    const { callId, participantId } = await params;

    if (!callId || !participantId) {
      return createCorsErrorResponse('Missing callId or participantId parameter', 400);
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = UpdateParticipantRequestSchema.safeParse(body);

    if (!validation.success) {
      return createCorsErrorResponse(
        `Invalid request: ${validation.error.message}`,
        400
      );
    }

    const updates = validation.data;

    // Check if call exists
    const callState = await getCallState(callId);
    if (!callState) {
      return createCorsErrorResponse('Call not found', 404);
    }

    // Check if participant exists
    const participant = callState.participants?.find(p => p.participantId === participantId);
    if (!participant) {
      return createCorsErrorResponse('Participant not found', 404);
    }

    // Update the participant
    const success = await updateParticipant(callId, participantId, updates);

    if (!success) {
      return createCorsErrorResponse('Failed to update participant', 500);
    }

    return createCorsSuccessResponse({
      message: 'Participant updated successfully',
      callId,
      participantId,
      updates,
    });
  } catch (error: any) {
    console.error('[v0] Update participant error:', error);
    return createCorsErrorResponse(
      `Failed to update participant: ${error.message}`,
      500
    );
  }
}

/**
 * DELETE /api/calls/:callId/participants/:participantId
 * Remove participant from call
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string; participantId: string }> }
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

    const { callId, participantId } = await params;

    if (!callId || !participantId) {
      return createCorsErrorResponse('Missing callId or participantId parameter', 400);
    }

    // Check if call exists
    const callState = await getCallState(callId);
    if (!callState) {
      return createCorsErrorResponse('Call not found', 404);
    }

    // Check if participant exists
    const participant = callState.participants?.find(p => p.participantId === participantId);
    if (!participant) {
      return createCorsErrorResponse('Participant not found', 404);
    }

    // Remove the participant
    const success = await removeParticipant(callId, participantId);

    if (!success) {
      return createCorsErrorResponse('Failed to remove participant', 500);
    }

    return createCorsSuccessResponse({
      message: 'Participant removed successfully',
      callId,
      participantId,
    });
  } catch (error: any) {
    console.error('[v0] Remove participant error:', error);
    return createCorsErrorResponse(
      `Failed to remove participant: ${error.message}`,
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
