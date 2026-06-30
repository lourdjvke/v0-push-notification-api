import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/firebase';
import { ref, get, set, update } from 'firebase/database';

const FREE_USER_EMAIL = 'jvkechris@gmail.com';
const ADMIN_CODE = '988555';
const DEFAULT_PRICE_KOBO = 500000; // 5000 NGN
const DEFAULT_PRICE_NGN = 5000;

export async function GET(request: NextRequest) {
  try {
    const settingsRef = ref(database, 'settings/apikey_pricing');
    const snapshot = await get(settingsRef);

    if (!snapshot.exists()) {
      // Return default pricing
      return NextResponse.json({
        amount: DEFAULT_PRICE_KOBO,
        displayAmount: DEFAULT_PRICE_NGN,
        currency: 'NGN',
        updatedAt: new Date().toISOString(),
        isDefault: true,
      });
    }

    const pricing = snapshot.val();
    return NextResponse.json({
      amount: pricing.amount || DEFAULT_PRICE_KOBO,
      displayAmount: pricing.displayAmount || DEFAULT_PRICE_NGN,
      currency: 'NGN',
      updatedAt: pricing.updatedAt,
      updatedBy: pricing.updatedBy,
      history: pricing.history || [],
    });
  } catch (error: any) {
    console.error('[v0] Get pricing error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, displayAmount } = body;

    // Validate admin access
    if (email !== FREE_USER_EMAIL) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (code !== ADMIN_CODE) {
      return NextResponse.json(
        { success: false, error: 'Invalid code' },
        { status: 403 }
      );
    }

    if (!displayAmount || displayAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid price' },
        { status: 400 }
      );
    }

    // Convert NGN to Kobo (multiply by 100)
    const amountInKobo = displayAmount * 100;
    const now = new Date().toISOString();

    // Get current pricing to add to history
    const settingsRef = ref(database, 'settings/apikey_pricing');
    const snapshot = await get(settingsRef);
    let history = [];

    if (snapshot.exists()) {
      history = snapshot.val().history || [];
    }

    // Add new entry to history (keep last 10)
    history.unshift({
      amount: amountInKobo,
      displayAmount: displayAmount,
      timestamp: now,
      updatedBy: email,
    });
    history = history.slice(0, 10);

    // Update pricing
    await set(settingsRef, {
      amount: amountInKobo,
      displayAmount: displayAmount,
      currency: 'NGN',
      updatedAt: now,
      updatedBy: email,
      history: history,
    });

    return NextResponse.json({
      success: true,
      message: `Price updated to ${displayAmount} NGN (${amountInKobo} Kobo)`,
      amount: amountInKobo,
      displayAmount: displayAmount,
      updatedAt: now,
    });
  } catch (error: any) {
    console.error('[v0] Update pricing error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
