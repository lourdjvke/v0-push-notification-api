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

    // Validate the API key
    const validation = await validateApiKeyAsync(request);

    return createCorsSuccessResponse({
      status: 'ok',
      message: 'CORS not blocking',
      apiKeyValid: validation.valid,
      email: validation.email || undefined,
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error: any) {
    console.error('[v0] Connection check error:', error);
    // Still return success - this is just a CORS test, API key validation is secondary
    return createCorsSuccessResponse({
      status: 'ok',
      message: 'CORS not blocking',
      corsWorking: true,
      timestamp: new Date().toISOString(),
    }, 200);
  }
}

/**
 * Handle OPTIONS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}
