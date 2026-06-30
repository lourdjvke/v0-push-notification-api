import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/firebase';
import { ref, set } from 'firebase/database';
import crypto from 'crypto';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY;
const FALLBACK_URL = 'https://v0-push-notification-api-nu.vercel.app';

export async function GET(request: NextRequest) {
  try {
    const amount = request.nextUrl.searchParams.get('amount');
    const metadata = request.nextUrl.searchParams.get('metadata');

    console.log('[v0] Pay endpoint called - amount:', amount);
    console.log('[v0] PAYSTACK_SECRET_KEY set:', !!PAYSTACK_SECRET_KEY);

    // Validate amount
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      );
    }

    if (!PAYSTACK_SECRET_KEY) {
      console.error('[v0] PAYSTACK_SECRET_KEY is not configured');
      return NextResponse.json(
        { success: false, error: 'Payment gateway not configured' },
        { status: 500 }
      );
    }

    const amountInKobo = Number(amount);

    // Generate unique transaction ID
    const transactionId = `TX_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const reference = `PAY-${Date.now()}`;

    console.log('[v0] Initializing Paystack - amount:', amountInKobo, 'reference:', reference);

    // Initialize Paystack payment
    const initializeResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInKobo,
        email: 'generic@payment.local', // Generic, not user-specific
        reference: reference,
        metadata: metadata ? JSON.parse(metadata) : { transactionId },
      }),
    });

    const payStackData = await initializeResponse.json();
    console.log('[v0] Paystack response status:', initializeResponse.status);
    console.log('[v0] Paystack response:', JSON.stringify(payStackData).substring(0, 300));

    if (!payStackData.status) {
      console.error('[v0] Paystack failed:', payStackData);
      throw new Error(payStackData.message || 'Failed to initialize Paystack payment');
    }

    // Store payment in Firebase
    const paymentRef = ref(database, `payments/${transactionId}`);
    await set(paymentRef, {
      amount: amountInKobo,
      status: 'pending',
      reference: reference,
      paystackReference: payStackData.data.reference,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
      webhook_verified: false,
      metadata: metadata ? JSON.parse(metadata) : {},
    });

    return NextResponse.json({
      success: true,
      transactionId,
      amount: amountInKobo,
      currency: 'NGN',
      reference: reference,
      authorizationUrl: payStackData.data.authorization_url,
      accessCode: payStackData.data.access_code,
      expiresIn: 3600,
      createdAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[v0] Pay endpoint error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Payment initialization failed' },
      { status: 500 }
    );
  }
}
