import { NextRequest, NextResponse } from 'next/server';

/**
 * CORS configuration for cross-origin requests
 * Allows all origins for public APIs
 */
export function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  return response;
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreFlight(request: NextRequest): NextResponse | null {
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    return addCorsHeaders(response);
  }
  return null;
}

/**
 * Wrapper function to add CORS headers to any NextResponse
 */
export function withCors(response: NextResponse): NextResponse {
  return addCorsHeaders(response);
}

/**
 * Create a success response with CORS headers
 */
export function createCorsSuccessResponse(data: any, status: number = 200): NextResponse {
  const response = NextResponse.json(data, { status });
  return addCorsHeaders(response);
}

/**
 * Create an error response with CORS headers
 */
export function createCorsErrorResponse(message: string, status: number = 400): NextResponse {
  const response = NextResponse.json({ error: message }, { status });
  return addCorsHeaders(response);
}
