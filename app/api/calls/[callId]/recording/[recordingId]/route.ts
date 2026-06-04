import { NextRequest } from 'next/server';
import { validateApiKeyAsync } from '@/lib/api-auth';
import { handleCorsPreFlight, createCorsErrorResponse, createCorsSuccessResponse } from '@/lib/cors';
import { getRecordingMetadata } from '@/lib/recording-service';

/**
 * GET /api/calls/:callId/recording/:recordingId
 * Retrieve recording metadata and storage options
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string; recordingId: string }> }
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

    const { callId, recordingId } = await params;

    if (!callId || !recordingId) {
      return createCorsErrorResponse('Missing callId or recordingId parameter', 400);
    }

    // Get recording metadata
    const metadata = await getRecordingMetadata(callId, recordingId);

    if (!metadata) {
      return createCorsErrorResponse('Recording not found', 404);
    }

    return createCorsSuccessResponse({
      recording: metadata,
    });
  } catch (error: any) {
    console.error('[v0] Get recording error:', error);
    return createCorsErrorResponse(
      `Failed to get recording: ${error.message}`,
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
