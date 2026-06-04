import { NextRequest } from 'next/server';
import { validateApiKeyAsync } from '@/lib/api-auth';
import { handleCorsPreFlight, createCorsErrorResponse, createCorsSuccessResponse } from '@/lib/cors';
import { startRecording, getCallRecordings } from '@/lib/recording-service';
import { getCallState } from '@/lib/call-service';
import { StartRecordingRequestSchema, RecordingResponseSchema } from '@/lib/call-schemas';

/**
 * POST /api/calls/:callId/recording/start
 * Begin recording the call
 * 
 * Body:
 * {
 *   "format": "webm" | "mp4" (optional, default: "webm"),
 *   "includeAudio": boolean (optional, default: true),
 *   "includeVideo": boolean (optional, default: true),
 *   "layout": "grid" | "speaker" | "custom" (optional, default: "grid")
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
    const validation = StartRecordingRequestSchema.safeParse(body);

    if (!validation.success) {
      return createCorsErrorResponse(
        `Invalid request: ${validation.error.message}`,
        400
      );
    }

    const { format, includeAudio, includeVideo, layout } = validation.data;

    // Check if call exists and is active
    const callState = await getCallState(callId);
    if (!callState) {
      return createCorsErrorResponse('Call not found', 404);
    }

    if (callState.status !== 'active') {
      return createCorsErrorResponse('Call is not active', 400);
    }

    // Check if there's already an active recording
    const existingRecordings = await getCallRecordings(callId);
    const activeRecording = existingRecordings.find(r => r.status === 'recording');
    if (activeRecording) {
      return createCorsErrorResponse('A recording is already in progress', 400);
    }

    // Start the recording
    const result = await startRecording(callId, {
      format,
      includeAudio,
      includeVideo,
      layout,
    });

    if (!result) {
      return createCorsErrorResponse('Failed to start recording', 500);
    }

    // Validate response schema
    const response = {
      recordingId: result.recordingId,
      status: result.status,
    };

    const responseValidation = RecordingResponseSchema.safeParse(response);
    if (!responseValidation.success) {
      console.error('[v0] Response validation failed:', responseValidation.error);
      return createCorsErrorResponse('Internal server error', 500);
    }

    return createCorsSuccessResponse(responseValidation.data, 201);
  } catch (error: any) {
    console.error('[v0] Start recording error:', error);
    return createCorsErrorResponse(
      `Failed to start recording: ${error.message}`,
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
