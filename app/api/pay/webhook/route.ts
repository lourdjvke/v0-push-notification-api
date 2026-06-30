import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/firebase';
import { ref, get, update } from 'firebase/database';
import crypto from 'crypto';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-paystack-signature');
    const body = await request.text();

    if (!signature) {
      return NextResponse.json(
        { success: false, error: 'No signature provided' },
        { status: 400 }
      );
    }

    // Verify Paystack signature
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY || '')
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 403 }
      );
    }

    const event = JSON.parse(body);

    // Only process successful charges
    if (event.event !== 'charge.success') {
      return NextResponse.json({ success: true, message: 'Event ignored' });
    }

    const paystackReference = event.data.reference;
    const amount = event.data.amount;
    const paid = event.data.paid;

    if (!paid) {
      return NextResponse.json({ success: true, message: 'Payment not completed' });
    }

    // Find transaction by Paystack reference
    const paymentsRef = ref(database, 'payments');
    const snapshot = await get(paymentsRef);

    if (!snapshot.exists()) {
      console.warn('[v0] No payments found in database');
      return NextResponse.json({ success: true, message: 'No matching transaction' });
    }

    let transactionId: string | null = null;
    const payments = snapshot.val();

    for (const [txId, payment] of Object.entries(payments)) {
      const p = payment as any;
      if (p.paystackReference === paystackReference) {
        transactionId = txId;
        break;
      }
    }

    if (!transactionId) {
      console.warn('[v0] No matching transaction found for reference:', paystackReference);
      return NextResponse.json({ success: true, message: 'No matching transaction' });
    }

    // Update payment status
    const paymentRef = ref(database, `payments/${transactionId}`);
    await update(paymentRef, {
      status: 'success',
      verifiedAt: new Date().toISOString(),
      webhook_verified: true,
    });

    console.log('[v0] Payment verified successfully:', transactionId);

    return NextResponse.json({
      success: true,
      message: 'Webhook processed',
      transactionId,
    });
  } catch (error: any) {
    console.error('[v0] Webhook error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
