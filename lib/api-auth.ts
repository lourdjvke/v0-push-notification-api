import { NextRequest, NextResponse } from 'next/server';

// Default API keys - in production, use environment variables
const VALID_API_KEYS = process.env.PUSH_API_KEYS 
  ? process.env.PUSH_API_KEYS.split(',').map(key => key.trim())
  : ['test-api-key-12345'];

export function validateApiKey(request: NextRequest): { valid: boolean; error?: string } {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return {
      valid: false,
      error: 'Missing Authorization header',
    };
  }

  // Support both "Bearer TOKEN" and plain token formats
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7)
    : authHeader;

  if (!VALID_API_KEYS.includes(token)) {
    return {
      valid: false,
      error: 'Invalid API key',
    };
  }

  return { valid: true };
}

export function createUnauthorizedResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Unauthorized: Invalid or missing API key' },
    { status: 401 }
  );
}

export function createErrorResponse(message: string, status: number = 400): NextResponse {
  return NextResponse.json(
    { error: message },
    { status }
  );
}

export function createSuccessResponse(data: any, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}
