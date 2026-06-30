import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/firebase';
import { ref, get, update } from 'firebase/database';

export async function GET(request: NextRequest) {
  try {
    const transactionId = request.nextUrl.searchParams.get('id');

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID required' },
        { status: 400 }
      );
    }

    // Get payment from Firebase
    const paymentRef = ref(database, `payments/${transactionId}`);
    const snapshot = await get(paymentRef);

    if (!snapshot.exists()) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    const payment = snapshot.val();

    // Check if transaction has expired
    if (new Date() > new Date(payment.expiresAt)) {
      return NextResponse.json({
        transactionId,
        status: 'expired',
        amount: payment.amount,
        currency: 'NGN',
        reference: payment.reference,
        message: 'Payment link expired',
      });
    }

    // Return current status
    return NextResponse.json({
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
    return NextResponse.json(
      { error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
