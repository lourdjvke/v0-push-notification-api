import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { handleCorsPreFlight, createCorsSuccessResponse, createCorsErrorResponse } from '@/lib/cors';

const FREE_USER_EMAIL = 'jvkechris@gmail.com';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');

    if (!email) {
      return createCorsErrorResponse('Email required', 400);
    }

    // Check if free user
    if (email === FREE_USER_EMAIL) {
      return createCorsSuccessResponse({
        hasAccess: true,
        reason: 'free_user',
        isFreeUser: true,
        email,
      });
    }

    // Check if user has active payment
    const paymentsRef = ref(database, 'payments');
    const snapshot = await get(paymentsRef);

    if (!snapshot.exists()) {
      return createCorsSuccessResponse({
        hasAccess: false,
        reason: 'no_payment',
        isFreeUser: false,
        email,
        message: 'Payment required to access automation',
      });
    }

    const payments = snapshot.val();
    const now = new Date();

    // Find active payment for this email
    for (const [txId, payment] of Object.entries(payments)) {
      const p = payment as any;

      // Check if this payment has an active subscription/access linked to email
      // For now, we'll check if they've ever made a successful payment
      if (
        p.status === 'success' &&
        p.verifiedAt &&
        new Date(p.expiresAt) > now
      ) {
        // Payment is still valid
        return createCorsSuccessResponse({
          hasAccess: true,
          reason: 'active_payment',
          isFreeUser: false,
          email,
          validUntil: p.expiresAt,
          transactionId: txId,
        });
      }
    }

    return createCorsSuccessResponse({
      hasAccess: false,
      reason: 'no_active_payment',
      isFreeUser: false,
      email,
      message: 'Payment required to access automation',
    });
  } catch (error: any) {
    console.error('[v0] Check access error:', error);
    return createCorsErrorResponse(error.message, 500);
  }
}
