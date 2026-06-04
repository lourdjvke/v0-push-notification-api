import { NextRequest } from 'next/server';
import { validateApiKeyAsync } from '@/lib/api-auth';
import { handleCorsPreFlight, createCorsErrorResponse, createCorsSuccessResponse } from '@/lib/cors';
import { stopRecording, getCallRecordings } from '@/lib/recording-service';
import { RecordingResponseSchema } from '@/lib/call-schemas';

/**
 * POST /api/calls/:callId/recording/stop
 * Stop active recording
 * 
 * Body (optional):
 * {
 *   "recordingId": "string (optional - if not provided, stops the current active recording)",
 *   "fileSize": number (optional),
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

    // Parse request body (optional)
    let recordingId: string | undefined;
    let fileSize: number | undefined;
    let metadata: Record<string, any> | undefined;

    try {
      const body = await request.json();
      recordingId = body.recordingId;
      fileSize = body.fileSize;
      metadata = body.metadata;
    } catch {
      // Body is optional
    }

    // If no recordingId provided, find the active one
    if (!recordingId) {
      const recordings = await getCallRecordings(callId);
      const activeRecording = recordings.find(r => r.status === 'recording');
      if (!activeRecording) {
        return createCorsErrorResponse('No active recording found', 404);
      }
      recordingId = activeRecording.recordingId;
    }

    // Stop the recording
    const result = await stopRecording(callId, recordingId, {
      fileSize,
      metadata,
    });

    if (!result) {
      return createCorsErrorResponse('Failed to stop recording', 500);
    }

    // Validate response schema
    const response = {
      recordingId: result.recordingId,
      status: result.status,
      duration: result.duration,
      fileSize: result.fileSize,
    };

    const responseValidation = RecordingResponseSchema.safeParse(response);
    if (!responseValidation.success) {
      console.error('[v0] Response validation failed:', responseValidation.error);
      return createCorsErrorResponse('Internal server error', 500);
    }

    return createCorsSuccessResponse(responseValidation.data);
  } catch (error: any) {
    console.error('[v0] Stop recording error:', error);
    return createCorsErrorResponse(
      `Failed to stop recording: ${error.message}`,
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
