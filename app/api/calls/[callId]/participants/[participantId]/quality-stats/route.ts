import { NextRequest } from 'next/server';
import { validateApiKeyAsync } from '@/lib/api-auth';
import { handleCorsPreFlight, createCorsErrorResponse, createCorsSuccessResponse } from '@/lib/cors';
import { getCallState } from '@/lib/call-service';
import { QualityStatsSchema } from '@/lib/call-schemas';

/**
 * GET /api/calls/:callId/participants/:participantId/quality-stats
 * Returns real-time network quality metrics for a participant
 * 
 * Query Parameters:
 * - ?statsType=network|audio|video (optional)
 */
export async function GET(
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

    // Get call state
    const callState = await getCallState(callId);
    if (!callState) {
      return createCorsErrorResponse('Call not found', 404);
    }

    // Find participant
    const participant = callState.participants?.find(p => p.participantId === participantId);
    if (!participant) {
      return createCorsErrorResponse('Participant not found', 404);
    }

    // Generate mock quality stats
    // In a real implementation, this would come from the WebRTC peer connection stats
    // The client SDK would periodically report these stats to the server
    const stats = {
      participantId,
      latencyMs: Math.random() * 100 + 20, // 20-120ms
      packetLoss: Math.random() * 5, // 0-5%
      resolution: participant.videoEnabled
        ? {
            width: 1280,
            height: 720,
          }
        : undefined,
      bitrate: participant.videoEnabled ? Math.random() * 2000 + 500 : Math.random() * 128 + 32, // kbps
      fps: participant.videoEnabled ? Math.floor(Math.random() * 30) + 15 : undefined,
      audioLevel: Math.random() * 0.8, // 0-0.8
      timestamp: new Date().toISOString(),
    };

    // Validate against schema
    const validation = QualityStatsSchema.safeParse(stats);
    if (!validation.success) {
      console.error('[v0] Stats validation failed:', validation.error);
      return createCorsErrorResponse('Internal server error', 500);
    }

    return createCorsSuccessResponse({
      callId,
      participantId,
      stats: validation.data,
      note: 'These are simulated stats. In production, collect real WebRTC peer connection stats.',
    });
  } catch (error: any) {
    console.error('[v0] Get quality stats error:', error);
    return createCorsErrorResponse(
      `Failed to get quality stats: ${error.message}`,
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
