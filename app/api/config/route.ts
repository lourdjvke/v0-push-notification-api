import { NextResponse } from 'next/server';
import { getVapidPublicKey } from '@/lib/push-service';

/**
 * GET /api/config
 * Get public configuration needed for client-side push setup
 */
export async function GET() {
  return NextResponse.json({
    vapidPublicKey: getVapidPublicKey(),
  });
}
