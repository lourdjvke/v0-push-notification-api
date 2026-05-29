import { NextRequest } from 'next/server';
import { getVapidPublicKey } from '@/lib/push-service';
import { handleCorsPreFlight, createCorsSuccessResponse } from '@/lib/cors';

/**
 * GET /api/vapid
 * Returns the VAPID public key needed for subscribing to push notifications
 * No authentication required - this is public information needed by clients
 */
export async function GET(request: NextRequest) {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreFlight(request);
  if (preflightResponse) {
    return preflightResponse;
  }

  try {
    const publicKey = getVapidPublicKey();
    
    return createCorsSuccessResponse({
      publicKey,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[v0] VAPID key retrieval error:', error);
    return createCorsSuccessResponse({
      error: 'Failed to retrieve VAPID key',
      publicKey: '', // Fallback
    }, 500);
  }
}

/**
 * Handle OPTIONS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}
