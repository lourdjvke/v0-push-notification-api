import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/firebase';
import { ref, query, orderByChild, equalTo, get, set, update } from 'firebase/database';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email required' },
        { status: 400 }
      );
    }

    // Get all automations for this email
    const automationsRef = ref(database, 'automations');
    const snapshot = await get(automationsRef);

    if (!snapshot.exists()) {
      return NextResponse.json({ automations: [] });
    }

    const allAutomations = snapshot.val();
    const userAutomations: any[] = [];

    for (const [automationId, automation] of Object.entries(allAutomations)) {
      const a = automation as any;
      if (a.email === email) {
        userAutomations.push({
          id: automationId,
          ...a,
        });
      }
    }

    return NextResponse.json({
      automations: userAutomations.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    });
  } catch (error: any) {
    console.error('[v0] Get automations error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, automation } = body;

    if (!email || !automation) {
      return NextResponse.json(
        { error: 'Email and automation required' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (
      !automation.name ||
      !automation.firebasePath ||
      !automation.fieldMapping?.subscriptionId ||
      !automation.fieldMapping?.message
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate automation ID
    const automationId = `auto_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();

    // Create automation record
    const automationRef = ref(database, `automations/${automationId}`);
    await set(automationRef, {
      email,
      name: automation.name,
      firebasePath: automation.firebasePath,
      fieldMapping: {
        subscriptionId: automation.fieldMapping.subscriptionId,
        message: automation.fieldMapping.message,
        type: automation.fieldMapping.type || null,
        image: automation.fieldMapping.image || null,
        statusField: automation.fieldMapping.statusField || 'status',
      },
      enabled: true,
      createdAt: now,
      lastRun: null,
      runCount: 0,
      failureCount: 0,
    });

    return NextResponse.json({
      success: true,
      automationId,
      automation: {
        id: automationId,
        email,
        ...automation,
        enabled: true,
        createdAt: now,
        runCount: 0,
      },
    });
  } catch (error: any) {
    console.error('[v0] Create automation error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
