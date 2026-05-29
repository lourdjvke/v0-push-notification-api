import { NextRequest } from 'next/server';
import { handleCorsPreFlight, createCorsSuccessResponse, createCorsErrorResponse } from '@/lib/cors';
import { validateApiKeyAsync } from '@/lib/api-auth';

/**
 * GET /api/connection?apikey=YOUR_API_KEY
 * 
 * Verifies CORS connectivity and API key validity
 * This endpoint is specifically designed for testing CORS from embedded scripts
 * 
 * Query Parameters:
 * - apikey: Your API key (can be passed as query param for embedded scripts)
 * 
 * Response:
 * {
 *   "status": "ok",
 *   "message": "CORS not blocking",
 *   "apiKeyValid": true,
 *   "timestamp": "2024-05-29T12:00:00Z"
 * }
 */
export async function GET(request: NextRequest) {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreFlight(request);
  if (preflightResponse) {
    return preflightResponse;
  }

  try {
    const apiKey = request.nextUrl.searchParams.get('apikey');

    if (!apiKey) {
      return createCorsErrorResponse('API key is required as query parameter', 400);
    }

    // Create a temporary request with the API key in Authorization header
    // to validate it using existing validation logic
    const headers = new Headers(request.headers);
    headers.set('Authorization', `Bearer ${apiKey}`);
    const tempRequest = new NextRequest(request, { headers });

    const validation = await validateApiKeyAsync(tempRequest);

    return createCorsSuccessResponse({
      status: 'ok',
      message: 'CORS not blocking',
      apiKeyValid: validation.valid,
      email: validation.email,
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error: any) {
    console.error('[v0] Connection check error:', error);
    return createCorsErrorResponse(`Connection check failed: ${error.message}`, 500);
  }
}

/**
 * Handle OPTIONS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}
