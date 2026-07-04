import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/firebase';
import { ref, get, update } from 'firebase/database';
import { handleCorsPreFlight, createCorsSuccessResponse, createCorsErrorResponse } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

export async function GET(request: NextRequest) {
  try {
    const transactionId = request.nextUrl.searchParams.get('id');

    if (!transactionId) {
      return createCorsErrorResponse('Transaction ID required', 400);
    }

    // Get payment from Firebase
    const paymentRef = ref(database, `payments/${transactionId}`);
    const snapshot = await get(paymentRef);

    if (!snapshot.exists()) {
      return createCorsErrorResponse('Transaction not found', 404);
    }

    const payment = snapshot.val();

    // Check if transaction has expired
    if (new Date() > new Date(payment.expiresAt)) {
      return createCorsSuccessResponse({
        transactionId,
        status: 'expired',
        amount: payment.amount,
        currency: 'NGN',
        reference: payment.reference,
        message: 'Payment link expired',
      });
    }

    // Return current status
    return createCorsSuccessResponse({
      transactionId,
      status: payment.status,
      amount: payment.amount,
      currency: 'NGN',
      reference: payment.reference,
      expiresIn: Math.floor((new Date(payment.expiresAt).getTime() - Date.now()) / 1000),
      message: payment.status === 'pending' ? 'Waiting for payment' : `Payment ${payment.status}`,
      verifiedAt: payment.verifiedAt,
      metadata: payment.metadata || {},
    });
  } catch (error: any) {
    console.error('[v0] Verify endpoint error:', error);
    return createCorsErrorResponse(error.message || 'Verification failed', 500);
  }
}
