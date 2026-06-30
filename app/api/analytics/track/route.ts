import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/firebase';
import { ref, get, update } from 'firebase/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, subscriptionId, notificationId } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'subscriptionId required' },
        { status: 400 }
      );
    }

    // Get the subscription
    const subRef = ref(database, `subscriptions/${subscriptionId}`);
    const snapshot = await get(subRef);

    if (!snapshot.exists()) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    const subData = snapshot.val();

    // Initialize stats if they don't exist
    if (!subData.stats) {
      subData.stats = {
        notificationsReceived: 0,
        notificationsOpened: 0,
        notificationsClicked: 0,
      };
    }

    // Update based on event type
    if (type === 'received') {
      subData.stats.notificationsReceived = (subData.stats.notificationsReceived || 0) + 1;
    } else if (type === 'opened' || type === 'clicked') {
      subData.stats.notificationsOpened = (subData.stats.notificationsOpened || 0) + 1;
      subData.stats.notificationsClicked = (subData.stats.notificationsClicked || 0) + 1;
    }

    // Save updated stats
    await update(subRef, { stats: subData.stats });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[v0] Track analytics error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
