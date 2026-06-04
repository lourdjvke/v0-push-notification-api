import { NextRequest, NextResponse } from 'next/server';
import { validateApiKeyAsync, createErrorResponse, createSuccessResponse } from '@/lib/api-auth';
import { handleCorsPreFlight, createCorsErrorResponse, createCorsSuccessResponse } from '@/lib/cors';
import { createCall } from '@/lib/call-service';
import { CreateCallRequestSchema, CreateCallResponseSchema } from '@/lib/call-schemas';

/**
 * POST /api/calls/create
 * Create a new call session
 * 
 * Body:
 * {
 *   "roomId": "string (required)",
 *   "type": "video" | "audio" (optional, default: "video"),
 *   "maxParticipants": number (optional, default: 10),
 *   "metadata": object (optional)
 * }
 */
export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = CreateCallRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return createCorsErrorResponse(
        `Invalid request: ${validationResult.error.message}`,
        400
      );
    }

    const { roomId, type, maxParticipants, metadata } = validationResult.data;

    // Create the call
    const callResult = await createCall(roomId, {
      type,
      maxParticipants,
      metadata,
      creatorEmail: auth.email,
    });

    // Format response
    const response: typeof CreateCallResponseSchema = {
      callId: callResult.callId,
      token: callResult.token,
      participantId: callResult.participantId,
      expiresIn: callResult.expiresIn,
      iceServers: callResult.iceServers,
      createdAt: new Date().toISOString(),
    };

    // Validate response schema
    const responseValidation = CreateCallResponseSchema.safeParse(response);
    if (!responseValidation.success) {
      console.error('[v0] Response validation failed:', responseValidation.error);
      return createCorsErrorResponse('Internal server error', 500);
    }

    return createCorsSuccessResponse(responseValidation.data, 201);
  } catch (error: any) {
    console.error('[v0] Create call error:', error);
    return createCorsErrorResponse(
      `Failed to create call: ${error.message}`,
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
