import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/firebase';
import { ref, set } from 'firebase/database';
import crypto from 'crypto';
import { handleCorsPreFlight, createCorsSuccessResponse, createCorsErrorResponse } from '@/lib/cors';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const FALLBACK_URL = 'https://v0-push-notification-api-nu.vercel.app';

// Helper function to process payment request
async function processPayment(
  amount: number,
  email: string = 'payments@v0-push-notification.com',
  metadata: any = {},
  brandName: string = 'v0 Push Notification'
) {
    if (!PAYSTACK_SECRET_KEY) {
      console.error('[v0] PAYSTACK_SECRET_KEY is not configured');
      return createCorsErrorResponse('Payment gateway not configured', 500);
    }

  if (!amount || isNaN(amount) || amount <= 0) {
    throw new Error('Invalid amount');
  }

  const amountInKobo = Number(amount);
  const transactionId = `TX_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const reference = `PAY-${Date.now()}`;

  console.log('[v0] Initializing Paystack - amount:', amountInKobo, 'email:', email, 'reference:', reference);

  // Initialize Paystack payment with all channels enabled
  const initializeResponse = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountInKobo,
      email: email,
      reference: reference,
      metadata: { ...metadata, transactionId },
      channels: ['card', 'bank', 'bank_transfer', 'ussd', 'mobile_money'], // All payment methods
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
    email: email,
    brandName: brandName,
    metadata: metadata,
  });

  return {
    transactionId,
    amount: amountInKobo,
    currency: 'NGN',
    reference: reference,
    authorizationUrl: payStackData.data.authorization_url,
    accessCode: payStackData.data.access_code,
    expiresIn: 3600,
    createdAt: new Date().toISOString(),
  };
}

// GET endpoint - for URL-based payment (backward compatible)
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

export async function GET(request: NextRequest) {
  try {
    const amount = request.nextUrl.searchParams.get('amount');
    const email = request.nextUrl.searchParams.get('email');
    const brandName = request.nextUrl.searchParams.get('brandName');
    const metadata = request.nextUrl.searchParams.get('metadata');

    console.log('[v0] Pay endpoint called - amount:', amount);
    console.log('[v0] PAYSTACK_SECRET_KEY set:', !!PAYSTACK_SECRET_KEY);

    // Validate amount
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return createCorsErrorResponse('Invalid amount', 400);
    }

    const paymentData = await processPayment(
      Number(amount),
      email || 'payments@v0-push-notification.com',
      metadata ? JSON.parse(metadata) : {},
      brandName || 'v0 Push Notification'
    );

      return createCorsSuccessResponse({
        success: true,
        transactionId,
        amount: amountInKobo,
        currency: 'NGN',
        reference: reference,
        authorizationUrl: paystackData.data.authorization_url,
        accessCode: paystackData.data.access_code,
        expiresIn: 3600,
        createdAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('[v0] Pay endpoint error:', error);
      return createCorsErrorResponse(error.message, 500);
    }
  }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, email, metadata, brandName } = body;

    console.log('[v0] Pay POST endpoint called - amount:', amount, 'email:', email);

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return createCorsErrorResponse('Invalid amount', 400);
    }

    const paymentData = await processPayment(
      Number(amount),
      email || 'payments@v0-push-notification.com',
      metadata || {},
      brandName || 'v0 Push Notification'
    );

    return createCorsSuccessResponse({
      success: true,
      ...paymentData,
    });
  } catch (error: any) {
    console.error('[v0] POST pay endpoint error:', error);
    return createCorsErrorResponse(error.message, 500);
  }
}
