import { NextRequest, NextResponse } from 'next/server';
import { database, ref, get } from '@/lib/firebase';

// Default API keys - in production, use environment variables
const VALID_API_KEYS = process.env.PUSH_API_KEYS 
  ? process.env.PUSH_API_KEYS.split(',').map(key => key.trim())
  : ['test-api-key-12345'];

export function validateApiKeySync(request: NextRequest): { valid: boolean; error?: string } {
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

export async function validateApiKeyAsync(request: NextRequest): Promise<{ valid: boolean; email?: string; error?: string }> {
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

  // Check environment API keys first (faster)
  if (VALID_API_KEYS.includes(token)) {
    return { valid: true };
  }

  // Check database for user-created keys
  try {
    const keysRef = ref(database, 'api_keys');
    const snapshot = await get(keysRef);

    if (snapshot.exists()) {
      const allKeys = snapshot.val();
      for (const email in allKeys) {
        for (const keyId in allKeys[email]) {
          if (allKeys[email][keyId].key === token) {
            return { valid: true, email };
          }
        }
      }
    }
  } catch (error: any) {
    console.error('[v0] Error validating API key:', error);
  }

  return {
    valid: false,
    error: 'Invalid API key',
  };
}

// Keep the old name for backwards compatibility
export function validateApiKey(request: NextRequest): { valid: boolean; error?: string } {
  return validateApiKeySync(request);
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
