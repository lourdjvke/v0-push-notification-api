import { NextRequest, NextResponse } from 'next/server';
import { database, ref, get, set, remove } from '@/lib/firebase';
import crypto from 'crypto';

function generateApiKey(): string {
  return 'sk_' + crypto.randomBytes(32).toString('hex');
}

function generateKeyId(): string {
  return crypto.randomBytes(8).toString('hex');
}

// Encode email to be Firebase-safe (replace dots with underscores)
function encodeEmail(email: string): string {
  return email.replace(/\./g, '_');
}

// Decode email back from Firebase-safe format
function decodeEmail(encoded: string): string {
  return encoded.replace(/_/g, '.');
}

/**
 * GET /api/keys
 * List all API keys for an email
 */
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    const encodedEmail = encodeEmail(email);
    const keysRef = ref(database, `api_keys/${encodedEmail}`);
    const snapshot = await get(keysRef);

    let keys: any[] = [];
    if (snapshot.exists()) {
      const keysData = snapshot.val();
      keys = Object.entries(keysData).map(([id, data]: any) => ({
        id,
        name: data.name,
        createdAt: data.createdAt,
        lastUsed: data.lastUsed,
        key: data.key.substring(0, 20) + '...' + data.key.substring(data.key.length - 4), // Masked
      }));
    }

    return NextResponse.json({ keys }, { status: 200 });
  } catch (error: any) {
    console.error('[v0] Get keys error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/keys
 * Create a new API key
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Key name is required' },
        { status: 400 }
      );
    }

    const keyId = generateKeyId();
    const apiKey = generateApiKey();
    const now = new Date().toISOString();
    const encodedEmail = encodeEmail(email);

    const keyData = {
      key: apiKey,
      name: name.trim(),
      createdAt: now,
      lastUsed: null,
    };

    const keysRef = ref(database, `api_keys/${encodedEmail}/${keyId}`);
    await set(keysRef, keyData);

    return NextResponse.json(
      {
        id: keyId,
        name: keyData.name,
        key: apiKey,
        createdAt: now,
        message: 'Save this key somewhere safe. You won\'t be able to see it again.',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[v0] Create key error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/keys
 * Delete an API key
 */
export async function DELETE(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');
    const keyId = request.nextUrl.searchParams.get('keyId');

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    if (!keyId) {
      return NextResponse.json(
        { error: 'Key ID is required' },
        { status: 400 }
      );
    }

    const encodedEmail = encodeEmail(email);
    const keyRef = ref(database, `api_keys/${encodedEmail}/${keyId}`);
    await remove(keyRef);

    return NextResponse.json(
      { message: 'Key deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[v0] Delete key error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
