import * as crypto from 'crypto';

/**
 * Call Token Management
 * Generates short-lived JWT tokens for WebRTC session participation
 * No external JWT library - simple implementation using Node's crypto
 */

interface CallTokenPayload {
  callId: string;
  participantId: string;
  userId?: string;
  userName?: string;
  expiresAt: number; // Unix timestamp
  iat: number; // Issued at
}

interface CallTokenVerification {
  valid: boolean;
  payload?: CallTokenPayload;
  error?: string;
}

const TOKEN_SECRET = process.env.CALL_TOKEN_SECRET || 'default-call-token-secret-change-in-production';
const DEFAULT_TTL = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Generate a call participation token
 */
export function generateCallToken(
  callId: string,
  participantId: string,
  options?: {
    userId?: string;
    userName?: string;
    ttlMs?: number; // Time to live in milliseconds
  }
): string {
  const now = Date.now();
  const ttl = options?.ttlMs || DEFAULT_TTL;
  
  const payload: CallTokenPayload = {
    callId,
    participantId,
    userId: options?.userId,
    userName: options?.userName,
    iat: Math.floor(now / 1000),
    expiresAt: Math.floor((now + ttl) / 1000),
  };

  // Create header + payload + signature
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const headerEncoded = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64url');

  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(`${headerEncoded}.${payloadEncoded}`)
    .digest('base64url');

  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

/**
 * Verify a call token
 */
export function verifyCallToken(token: string): CallTokenVerification {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return {
        valid: false,
        error: 'Invalid token format',
      };
    }

    const [headerEncoded, payloadEncoded, signatureProvided] = parts;

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(`${headerEncoded}.${payloadEncoded}`)
      .digest('base64url');

    if (signatureProvided !== expectedSignature) {
      return {
        valid: false,
        error: 'Invalid token signature',
      };
    }

    // Decode payload
    const payloadJson = Buffer.from(payloadEncoded, 'base64url').toString('utf-8');
    const payload: CallTokenPayload = JSON.parse(payloadJson);

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.expiresAt < now) {
      return {
        valid: false,
        error: 'Token expired',
      };
    }

    return {
      valid: true,
      payload,
    };
  } catch (error: any) {
    return {
      valid: false,
      error: `Token verification failed: ${error.message}`,
    };
  }
}

/**
 * Generate multiple tokens (for batch operations)
 */
export function generateCallTokens(
  callId: string,
  participantIds: string[],
  options?: {
    ttlMs?: number;
  }
): Map<string, string> {
  const tokens = new Map<string, string>();
  
  for (const participantId of participantIds) {
    tokens.set(
      participantId,
      generateCallToken(callId, participantId, { ttlMs: options?.ttlMs })
    );
  }
  
  return tokens;
}
