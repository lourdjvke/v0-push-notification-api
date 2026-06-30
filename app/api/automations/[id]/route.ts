import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/firebase';
import { ref, get, update, remove } from 'firebase/database';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const automationId = params.id;
    const body = await request.json();

    const automationRef = ref(database, `automations/${automationId}`);
    const snapshot = await get(automationRef);

    if (!snapshot.exists()) {
      return NextResponse.json(
        { error: 'Automation not found' },
        { status: 404 }
      );
    }

    // Update fields
    const updates: any = {};
    if (body.enabled !== undefined) updates.enabled = body.enabled;
    if (body.name) updates.name = body.name;
    if (body.fieldMapping) updates.fieldMapping = body.fieldMapping;

    await update(automationRef, updates);

    return NextResponse.json({
      success: true,
      automationId,
    });
  } catch (error: any) {
    console.error('[v0] Update automation error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const automationId = params.id;

    const automationRef = ref(database, `automations/${automationId}`);
    const snapshot = await get(automationRef);

    if (!snapshot.exists()) {
      return NextResponse.json(
        { error: 'Automation not found' },
        { status: 404 }
      );
    }

    // Delete the automation
    await remove(automationRef);

    return NextResponse.json({
      success: true,
      message: 'Automation deleted',
    });
  } catch (error: any) {
    console.error('[v0] Delete automation error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
